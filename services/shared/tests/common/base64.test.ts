import { describe, test } from "@jest/globals";
import { base64 } from "../../src/common/index";
import { expect } from "@jest/globals";

describe("not really a test: actually generate bbs plus keys in a file for development purpose - usually skipped", () => {
    test("encode-then-decode-then-encode", () => {
        const value = new Uint8Array(32);
        const encodedValue = base64.encode(value);
        const decodedValue = base64.decode(encodedValue);
        expect(value).toEqual(decodedValue);
        const reEncodedValue = base64.encode(decodedValue);
        expect(encodedValue).toEqual(reEncodedValue);
    });
});
