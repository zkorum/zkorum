import html2canvas from "html2canvas";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  ref,
} from "vue";

import { useReportDownload } from "./useReportDownload";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  addImage: vi.fn(),
  file: vi.fn(),
  generateAsync: vi.fn<() => Promise<Blob>>(),
}));

vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({
  default: class {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    addPage = vi.fn();
    addImage = mocks.addImage;
    save = mocks.save;
  },
}));
vi.mock("jszip", () => ({
  default: class {
    file = mocks.file;
    generateAsync = mocks.generateAsync;
  },
}));

const apps: App[] = [];

function mountDownloads() {
  const active = ref(true);
  let downloads: ReturnType<typeof useReportDownload> | undefined;
  const Report = defineComponent({
    setup() {
      downloads = useReportDownload({ fileName: "report" });
      return () => h("article");
    },
  });
  const app = createApp({
    render: () =>
      h(KeepAlive, null, { default: () => (active.value ? h(Report) : null) }),
  });
  const container = document.createElement("div");
  document.body.append(container);
  app.mount(container);
  apps.push(app);
  if (downloads === undefined) throw new Error("Report did not mount");
  return { app, active, downloads };
}

function createCapture() {
  const element = document.createElement("section");
  document.body.append(element);
  return { element, name: "summary" };
}

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/jpeg;base64,test");
  vi.spyOn(canvas, "toBlob").mockImplementation((callback) =>
    callback(new Blob())
  );
  return canvas;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(html2canvas).mockImplementation((element) => {
    if (!element.isConnected) {
      throw new Error("Unable to find element in cloned iframe");
    }
    return Promise.resolve(createCanvas());
  });
  mocks.generateAsync.mockResolvedValue(new Blob());
});

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("report export cancellation", () => {
  it.each(["pdf", "zip"] as const)(
    "abandons a %s export if a pending image's element is detached",
    async (format) => {
      const { downloads } = mountDownloads();
      const capture = createCapture();
      const image = document.createElement("img");
      image.src = "/pending.png";
      capture.element.append(image);
      const pending =
        format === "pdf"
          ? downloads.downloadAsPdf({ captures: [capture] })
          : downloads.downloadAsZip({ captures: [capture] });
      // ZIP first awaits its lazy import, so wait until the image listener exists.
      const imageListener = vi.spyOn(image, "addEventListener");
      if (format === "zip") {
        await vi.waitFor(() =>
          expect(imageListener).toHaveBeenCalledWith(
            "load",
            expect.any(Function),
            { once: true }
          )
        );
      }
      capture.element.remove();
      image.dispatchEvent(new Event("load"));
      await expect(pending).resolves.toBeUndefined();
      expect(html2canvas).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
      expect(mocks.generateAsync).not.toHaveBeenCalled();
      expect(downloads.isGeneratingPdf.value).toBe(false);
      expect(downloads.isGeneratingZip.value).toBe(false);
    }
  );

  it("cancels an image wait immediately when the component unmounts", async () => {
    const { app, downloads } = mountDownloads();
    const capture = createCapture();
    const image = document.createElement("img");
    image.src = "/never-loads.png";
    capture.element.append(image);
    const pending = downloads.downloadAsPdf({ captures: [capture] });
    app.unmount();
    await pending;
    expect(html2canvas).not.toHaveBeenCalled();
    expect(downloads.isGeneratingPdf.value).toBe(false);
  });

  it("does not resume an old export after KeepAlive reactivation", async () => {
    const { active, downloads } = mountDownloads();
    const render = Promise.withResolvers<HTMLCanvasElement>();
    vi.mocked(html2canvas).mockReturnValueOnce(render.promise);
    const captures = [createCapture(), createCapture()];
    const pending = downloads.downloadAsPdf({ captures });
    await vi.waitFor(() => expect(html2canvas).toHaveBeenCalledOnce());
    active.value = false;
    await nextTick();
    active.value = true;
    await nextTick();
    render.resolve(document.createElement("canvas"));
    await pending;
    expect(html2canvas).toHaveBeenCalledOnce();
    expect(mocks.save).not.toHaveBeenCalled();

    await downloads.downloadAsPdf({ captures });
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith("report.pdf");
    expect(mocks.addImage).toHaveBeenCalledTimes(2);
  });

  it("does not save a partial PDF when its footer is detached", async () => {
    const { downloads } = mountDownloads();
    await downloads.downloadAsPdf({
      captures: [createCapture()],
      footerElement: document.createElement("footer"),
    });
    expect(html2canvas).toHaveBeenCalledOnce();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each(["deactivated", "unmounted"] as const)(
    "ignores delayed exports after the report is %s",
    async (lifecycle) => {
      const { app, active, downloads } = mountDownloads();
      const capture = createCapture();
      if (lifecycle === "deactivated") {
        active.value = false;
        await nextTick();
      } else {
        app.unmount();
      }

      await downloads.downloadAsPdf({ captures: [capture] });
      await downloads.downloadAsZip({ captures: [capture] });
      expect(html2canvas).not.toHaveBeenCalled();
      expect(mocks.generateAsync).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
      expect(downloads.isGeneratingPdf.value).toBe(false);
      expect(downloads.isGeneratingZip.value).toBe(false);
    }
  );

  it("reports active render failures and releases the export lock", async () => {
    const { downloads } = mountDownloads();
    const error = new Error("Canvas rendering failed");
    vi.mocked(html2canvas).mockRejectedValueOnce(error);

    await expect(
      downloads.downloadAsPdf({ captures: [createCapture()] })
    ).rejects.toBe(error);
    expect(downloads.isGeneratingPdf.value).toBe(false);
    await downloads.downloadAsPdf({ captures: [createCapture()] });
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith("report.pdf");
  });

  it("discards late rendering failures from a cancelled export", async () => {
    const { active, downloads } = mountDownloads();
    const render = Promise.withResolvers<HTMLCanvasElement>();
    vi.mocked(html2canvas).mockReturnValueOnce(render.promise);
    const pending = downloads.downloadAsPdf({ captures: [createCapture()] });
    await vi.waitFor(() => expect(html2canvas).toHaveBeenCalledOnce());
    active.value = false;
    await nextTick();
    render.reject(new Error("Late rendering failure"));

    await expect(pending).resolves.toBeUndefined();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(downloads.isGeneratingPdf.value).toBe(false);
  });

  it("does not overlap PDF and ZIP exports", async () => {
    const { downloads } = mountDownloads();
    const render = Promise.withResolvers<HTMLCanvasElement>();
    vi.mocked(html2canvas).mockReturnValueOnce(render.promise);
    const captures = [createCapture()];
    const pending = downloads.downloadAsPdf({ captures });
    await downloads.downloadAsZip({ captures });
    expect(downloads.isGeneratingPdf.value).toBe(true);
    expect(downloads.isGeneratingZip.value).toBe(false);
    expect(mocks.generateAsync).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(html2canvas).toHaveBeenCalledOnce());
    render.resolve(createCanvas());
    await pending;
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith("report.pdf");
  });

  it("does not trigger a ZIP download after cancellation during compression", async () => {
    const { active, downloads } = mountDownloads();
    const compression = Promise.withResolvers<Blob>();
    mocks.generateAsync.mockReturnValueOnce(compression.promise);
    const createElement = vi.spyOn(document, "createElement");
    const pending = downloads.downloadAsZip({ captures: [createCapture()] });
    await vi.waitFor(() => expect(mocks.generateAsync).toHaveBeenCalledOnce());
    active.value = false;
    await nextTick();
    compression.resolve(new Blob());

    await pending;
    expect(mocks.file).toHaveBeenCalledOnce();
    expect(createElement).not.toHaveBeenCalledWith("a");
    expect(downloads.isGeneratingZip.value).toBe(false);
  });
});
