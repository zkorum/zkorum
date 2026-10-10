export interface PageMetadataPolicy {
  readonly robots: "noindex, nofollow" | undefined;
  readonly browserTranslationAllowed: boolean;
}

function createMetaTagController({
  document,
  name,
}: {
  document: Document;
  name: "robots" | "google";
}) {
  const selector =
    name === "google"
      ? 'meta[name="google" i][content="notranslate" i]'
      : 'meta[name="robots" i]';
  const originals = Array.from(
    document.head.querySelectorAll<HTMLMetaElement>(selector),
    (element) => ({ element, content: element.content })
  );
  const element = originals.at(0)?.element ?? document.createElement("meta");
  if (originals.length === 0) {
    element.name = name;
  }

  function set(content: string | undefined): void {
    for (const original of originals) {
      if (original.element !== element) {
        original.element.remove();
      }
    }
    if (content === undefined) {
      element.remove();
      return;
    }
    if (element.content !== content) {
      element.content = content;
    }
    if (element.parentElement !== document.head) {
      document.head.append(element);
    }
  }

  function restore(): void {
    if (originals.length === 0) {
      element.remove();
    }
    for (const original of originals) {
      if (original.element.content !== original.content) {
        original.element.content = original.content;
      }
      if (original.element.parentElement !== document.head) {
        document.head.append(original.element);
      }
    }
  }

  return { set, restore };
}

export function createPageMetadataController(document: Document) {
  const root = document.documentElement;
  const previousTranslate = root.getAttribute("translate") ?? undefined;
  const previouslyNotranslate = root.classList.contains("notranslate");
  const robots = createMetaTagController({ document, name: "robots" });
  const google = createMetaTagController({ document, name: "google" });

  function setTranslate(value: string | undefined): void {
    if ((root.getAttribute("translate") ?? undefined) === value) {
      return;
    }
    if (value === undefined) {
      root.removeAttribute("translate");
    } else {
      root.setAttribute("translate", value);
    }
  }

  function apply(policy: PageMetadataPolicy): void {
    robots.set(policy.robots);
    google.set(policy.browserTranslationAllowed ? undefined : "notranslate");
    root.classList.toggle("notranslate", !policy.browserTranslationAllowed);
    setTranslate(policy.browserTranslationAllowed ? undefined : "no");
  }

  function restore(): void {
    robots.restore();
    google.restore();
    root.classList.toggle("notranslate", previouslyNotranslate);
    setTranslate(previousTranslate);
  }

  return { apply, restore };
}
