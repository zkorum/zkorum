import sanitizeHtml from "sanitize-html";

export function sanitizeHtmlInput(htmlString: string): string {
  const options: sanitizeHtml.IOptions = {
    allowedTags: ["b", "br", "i", "strike", "u", "div"],
  };
  htmlString = sanitizeHtml(htmlString, options);
  return htmlString;
}

export function getHtmlStringCharacterCount(htmlString: string): number {
  const options: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {}
  };
  const rawTextWithoutTags = sanitizeHtml(htmlString, options);
  return rawTextWithoutTags.length;
}