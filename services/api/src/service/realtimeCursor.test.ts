import { describe, expect, it } from "vitest";
import {
    advanceRealtimeCursor,
    formatRealtimeCursor,
    parseRealtimeCursor,
} from "@/shared/utils/realtimeCursor.js";

describe("delivery-order replay cursors", () => {
    it("does not confuse old allocation cursors with delivery cursors", () => {
        expect(parseRealtimeCursor("123")).toBeUndefined();
        expect(parseRealtimeCursor(formatRealtimeCursor(123) ?? null)).toBe(
            123,
        );
    });

    it.each([
        null,
        "delivery:",
        "delivery:-1",
        "delivery:0",
        "delivery:1.5",
        "delivery:Infinity",
        "delivery:01",
        "delivery:1e3",
        "delivery:0x10",
        "delivery: 1",
        "delivery:9007199254740992",
    ])("rejects an invalid replay cursor %s", (cursor) => {
        expect(parseRealtimeCursor(cursor)).toBeUndefined();
    });

    it("keeps the reconnect cursor monotonic when replay overlaps live delivery", () => {
        let current: string | null = null;
        for (const incoming of [
            "delivery:9",
            "delivery:11",
            "delivery:10",
            "123",
            "invalid",
        ]) {
            current = advanceRealtimeCursor({ current, incoming });
        }
        expect(current).toBe("delivery:11");
        expect(advanceRealtimeCursor({ current, incoming: "" })).toBeNull();
    });
});
