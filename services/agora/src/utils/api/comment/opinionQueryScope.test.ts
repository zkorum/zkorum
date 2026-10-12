import { describe, expect, it } from "vitest";

import {
  isOpinionQueryForScope,
  type OpinionQueryScope,
} from "./opinionQueryScope";

const scope: OpinionQueryScope = {
  viewerUserId: "owner",
  displayLanguage: "en",
  spokenLanguages: ["fr", "en"],
};
describe("statement cache scope", () => {
  it("matches the viewer, display language, and spoken-language set", () => {
    expect(
      isOpinionQueryForScope({
        queryKey: ["comments", "convo", "new", "owner", "en", ["en", "fr"]],
        scope,
      })
    ).toBe(true);
    expect(
      isOpinionQueryForScope({
        queryKey: ["opinionTarget", "statement", "owner", "en", ["en", "fr"]],
        scope,
      })
    ).toBe(true);
    expect(
      isOpinionQueryForScope({
        queryKey: ["comments", "convo", "new", "other", "en", ["en", "fr"]],
        scope,
      })
    ).toBe(false);
    expect(
      isOpinionQueryForScope({
        queryKey: ["comments", "convo", "new", "owner", "fr", ["en", "fr"]],
        scope,
      })
    ).toBe(false);
    expect(
      isOpinionQueryForScope({
        queryKey: ["opinionTarget", "statement", "owner", "en", ["en"]],
        scope,
      })
    ).toBe(false);
  });
});
