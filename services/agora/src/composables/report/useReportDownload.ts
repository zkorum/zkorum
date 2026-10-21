import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  computed,
  type MaybeRefOrGetter,
  onActivated,
  onDeactivated,
  onScopeDispose,
  shallowRef,
  toValue,
} from "vue";

interface UseReportDownloadParams {
  fileName: MaybeRefOrGetter<string>;
}

interface ImageCapture {
  element: HTMLElement;
  name: string;
}

function waitForImage({
  image,
  signal,
}: {
  image: HTMLImageElement;
  signal: AbortSignal;
}): Promise<void> {
  if (image.complete || signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const cleanup = (): void => {
      image.removeEventListener("load", handleDone);
      image.removeEventListener("error", handleDone);
      signal.removeEventListener("abort", handleDone);
    };

    const handleDone = (): void => {
      cleanup();
      resolve();
    };

    image.addEventListener("load", handleDone, { once: true });
    image.addEventListener("error", handleDone, { once: true });
    signal.addEventListener("abort", handleDone, { once: true });
  });
}

async function waitForElementImages({
  element,
  signal,
}: {
  element: HTMLElement;
  signal: AbortSignal;
}): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));

  for (const image of images) {
    if (signal.aborted) return;
    await waitForImage({ image, signal });
  }
}

async function captureElement({
  element,
  signal,
  showCaptureHeaders = false,
  showCaptureFooters = false,
}: {
  element: HTMLElement;
  signal: AbortSignal;
  showCaptureHeaders?: boolean;
  showCaptureFooters?: boolean;
}): Promise<HTMLCanvasElement | undefined> {
  if (signal.aborted || !element.isConnected) return undefined;

  const needsClone = showCaptureHeaders || showCaptureFooters;
  await waitForElementImages({ element, signal });

  // Navigation (including KeepAlive deactivation) can detach the report while
  // images load. html2canvas can only clone elements still in the document.
  if (signal.aborted || !element.isConnected) return undefined;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: needsClone
      ? (clonedDoc) => {
          if (showCaptureHeaders) {
            clonedDoc
              .querySelectorAll<HTMLElement>(".capture-only")
              .forEach((captureHeader) => {
                captureHeader.style.display = "block";
              });
          }
          if (showCaptureFooters) {
            clonedDoc
              .querySelectorAll<HTMLElement>(".capture-footer")
              .forEach((captureFooter) => {
                captureFooter.style.display = "block";
              });
          }
        }
      : undefined,
  });

  return signal.aborted || !element.isConnected ? undefined : canvas;
}

function canvasToBlob({
  canvas,
  type = "image/jpeg",
  quality = 0.85,
}: {
  canvas: HTMLCanvasElement;
  type?: string;
  quality?: number;
}): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      type,
      quality
    );
  });
}

export function useReportDownload({ fileName }: UseReportDownloadParams) {
  const activeDownload = shallowRef<{
    format: "zip" | "pdf";
    controller: AbortController;
  }>();
  const isGeneratingZip = computed(
    () => activeDownload.value?.format === "zip"
  );
  const isGeneratingPdf = computed(
    () => activeDownload.value?.format === "pdf"
  );
  let isActive = true;

  function deactivate(): void {
    isActive = false;
    activeDownload.value?.controller.abort();
  }

  onActivated(() => {
    isActive = true;
  });
  onDeactivated(deactivate);
  onScopeDispose(deactivate);

  async function runDownload({
    format,
    generate,
  }: {
    format: "zip" | "pdf";
    generate: (signal: AbortSignal) => Promise<void>;
  }): Promise<void> {
    if (!isActive || activeDownload.value !== undefined) return;
    const controller = new AbortController();
    activeDownload.value = { format, controller };
    try {
      await generate(controller.signal);
    } catch (error) {
      // Rendering cannot be interrupted, so discard late failures from an export
      // the user already left. Active exports still report genuine failures.
      if (!controller.signal.aborted) throw error;
    } finally {
      activeDownload.value = undefined;
    }
  }

  async function downloadAsZip({
    captures,
  }: {
    captures: readonly ImageCapture[];
  }): Promise<void> {
    await runDownload({
      format: "zip",
      generate: async (signal) => {
        const JSZip = (await import("jszip")).default;
        if (signal.aborted) return;
        const zip = new JSZip();

        for (const capture of captures) {
          const canvas = await captureElement({
            element: capture.element,
            signal,
            showCaptureHeaders: true,
            showCaptureFooters: true,
          });
          if (canvas === undefined) return;
          const blob = await canvasToBlob({ canvas });
          if (signal.aborted) return;
          zip.file(`${capture.name}.jpg`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        if (signal.aborted) return;
        const link = document.createElement("a");
        link.download = `${toValue(fileName)}.zip`;
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
        // link.click() triggers the download asynchronously — the browser needs
        // time to process the blob and show the save dialog. Without this delay,
        // the loading state clears before the dialog appears.
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      },
    });
  }

  async function downloadAsPdf({
    captures,
    footerElement,
  }: {
    captures: readonly ImageCapture[];
    footerElement?: HTMLElement;
  }): Promise<void> {
    await runDownload({
      format: "pdf",
      generate: async (signal) => {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let isFirstPage = true;

        for (const capture of captures) {
          const canvas = await captureElement({
            element: capture.element,
            signal,
            showCaptureHeaders: !isFirstPage,
          });
          if (canvas === undefined) return;

          if (!isFirstPage) pdf.addPage();
          const imgData = canvas.toDataURL("image/jpeg", 0.8);
          const aspectRatio = canvas.width / canvas.height;
          pdf.addImage(
            imgData,
            "JPEG",
            0,
            0,
            pageWidth,
            pageWidth / aspectRatio
          );
          isFirstPage = false;
        }

        // Place footer at the absolute bottom of the last page
        if (footerElement) {
          const footerCanvas = await captureElement({
            element: footerElement,
            signal,
          });
          if (footerCanvas === undefined) return;
          const footerImgData = footerCanvas.toDataURL("image/jpeg", 0.8);
          const footerAspectRatio = footerCanvas.width / footerCanvas.height;
          const footerWidth = pageWidth;
          const footerHeight = pageWidth / footerAspectRatio;

          const FOOTER_BOTTOM_MARGIN_MM = 10;
          const footerY = pageHeight - footerHeight - FOOTER_BOTTOM_MARGIN_MM;
          pdf.addImage(
            footerImgData,
            "JPEG",
            0,
            footerY,
            footerWidth,
            footerHeight
          );
        }

        pdf.save(`${toValue(fileName)}.pdf`);
        // pdf.save() triggers the download asynchronously — the browser needs
        // time to process the blob and show the save dialog. Without this delay,
        // the loading state clears before the dialog appears.
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      },
    });
  }

  return { downloadAsZip, downloadAsPdf, isGeneratingZip, isGeneratingPdf };
}
