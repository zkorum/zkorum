import { format as formatCsv } from "fast-csv";

export async function buildCsvBuffer({
    headers,
    rows,
    escapeFormulaFields = [],
}: {
    headers?: readonly string[];
    rows: Record<string, string | number | null>[];
    escapeFormulaFields?: readonly string[];
}): Promise<Buffer> {
    const csvStream = formatCsv({
        headers: headers === undefined ? true : [...headers],
        alwaysWriteHeaders: headers !== undefined,
    });
    const chunks: Buffer[] = [];

    csvStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
    });

    for (const row of rows) {
        let formattedRow = row;
        for (const field of escapeFormulaFields) {
            const value = row[field];
            if (
                typeof value === "string" &&
                (value.startsWith("'") || /^[\s\uFEFF]*[=+\-@]/u.test(value))
            ) {
                // CSV quoting does not stop spreadsheet applications evaluating formulas.
                // Escape existing apostrophes too, so consumers can recover the original text.
                formattedRow = { ...formattedRow, [field]: `'${value}` };
            }
        }
        csvStream.write(formattedRow);
    }
    csvStream.end();

    await new Promise<void>((resolve, reject) => {
        csvStream.on("end", resolve);
        csvStream.on("error", reject);
    });

    return Buffer.concat(chunks);
}
