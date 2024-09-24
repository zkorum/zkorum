export function getCharacterCount(htmlText: string) {
  const div = document.createElement("div");
  div.innerHTML = htmlText;
  const text = div.innerText || "";
  return text.length;
}