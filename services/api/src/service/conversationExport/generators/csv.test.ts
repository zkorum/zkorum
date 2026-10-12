import { parseString } from "fast-csv";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildCsvBuffer } from "./csv.js";

describe("spreadsheet-safe survey text", () => {
    it("escapes formulas only in opted-in text fields without mutating the source rows", async () => {
        const values = [
            "=1+1",
            "+SUM(A1:A2)",
            "-1+2",
            "@SUM(A1)",
            "\t=1+1",
            "\r\n=1+1",
            'Cargo bike, "family"\n<literal text>',
            "'=already inert",
        ];
        const rows = values.map((value, index) => ({
            "participant-id": index,
            "answer-text-plain": value,
            untouched: value,
        }));
        const csv = await buildCsvBuffer({
            headers: ["participant-id", "answer-text-plain", "untouched"],
            rows,
            escapeFormulaFields: ["answer-text-plain"],
        });
        const parsed: Record<string, string>[] = [];
        const stream = parseString(csv.toString(), { headers: true });
        stream.on("data", (raw: unknown) =>
            parsed.push(z.record(z.string(), z.string()).parse(raw)),
        );
        await new Promise<void>((resolve, reject) => {
            stream.on("end", () => {
                resolve();
            });
            stream.on("error", reject);
        });
        expect(parsed.map((row) => row["answer-text-plain"])).toEqual(
            values.map((value, index) =>
                index < 6 || value.startsWith("'") ? `'${value}` : value,
            ),
        );
        expect(parsed.map((row) => row.untouched)).toEqual(values);
        expect(rows.map((row) => row["answer-text-plain"])).toEqual(values);
        const decoded = parsed.map((row) => {
            const value = row["answer-text-plain"] ?? "";
            const remainder = value.slice(1);
            return value.startsWith("'") &&
                (remainder.startsWith("'") ||
                    /^[\s\uFEFF]*[=+\-@]/u.test(remainder))
                ? remainder
                : value;
        });
        expect(decoded).toEqual(values);
    });
});
