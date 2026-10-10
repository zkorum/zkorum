import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("browser translation protection", () => {
  const htmlTemplate = readFileSync(
    resolve(process.cwd(), "index.html"),
    "utf8"
  );

  it("blocks browser translation by default until the active page opts in", () => {
    expect(htmlTemplate).toMatch(/<html[^>]*class="[^"]*notranslate[^"]*"/);
    expect(htmlTemplate).toMatch(/<html[^>]*translate="no"/);
    expect(htmlTemplate).toContain(
      '<meta name="google" content="notranslate" />'
    );
  });
});
