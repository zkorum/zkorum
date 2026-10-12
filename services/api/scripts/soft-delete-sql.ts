export type SqlOperation =
    | "SQL DELETE"
    | "SQL TRUNCATE"
    | "SQL DROP TABLE"
    | "Unresolved dynamic SQL";

export interface SqlFinding {
    readonly line: number;
    readonly operation: SqlOperation;
}

export const DYNAMIC_SQL_EXPRESSION = "__dynamic_sql_expression__";

interface Token {
    readonly kind: "word" | "identifier" | "literal" | "body" | "symbol";
    readonly value: string;
    readonly line: number;
}

function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let index = 0;
    let line = 1;
    const advance = (): string => {
        const character = source.charAt(index++);
        if (character === "\n") line++;
        return character;
    };
    while (index < source.length) {
        const character = source.charAt(index);
        const tag =
            character === "$"
                ? /^\$(?:[A-Za-z_]\w*)?\$/u.exec(source.slice(index))?.[0]
                : undefined;
        if (/\s/u.test(character)) {
            advance();
        } else if (source.startsWith("--", index)) {
            while (index < source.length && source.charAt(index) !== "\n")
                advance();
        } else if (source.startsWith("/*", index)) {
            advance();
            advance();
            let depth = 1;
            while (index < source.length && depth > 0) {
                if (source.startsWith("/*", index)) {
                    advance();
                    advance();
                    depth++;
                } else if (source.startsWith("*/", index)) {
                    advance();
                    advance();
                    depth--;
                } else advance();
            }
        } else if (
            character === "'" ||
            character === '"' ||
            /^[eE]'/.test(source.slice(index, index + 2))
        ) {
            const escaped = character !== "'" && character !== '"';
            const tokenLine = line;
            if (escaped) advance();
            const quote = advance();
            let value = "";
            while (index < source.length) {
                const next = advance();
                if (next === quote) {
                    if (source.charAt(index) !== quote) break;
                    value += advance();
                } else if (escaped && next === "\\") {
                    const escape = advance();
                    value +=
                        escape === "n"
                            ? "\n"
                            : escape === "r"
                              ? "\r"
                              : escape === "t"
                                ? "\t"
                                : escape;
                } else value += next;
            }
            tokens.push({
                kind: quote === '"' ? "identifier" : "literal",
                value,
                line: tokenLine,
            });
        } else if (tag !== undefined) {
            const tokenLine = line;
            index += tag.length;
            let value = "";
            while (index < source.length && !source.startsWith(tag, index))
                value += advance();
            if (source.startsWith(tag, index)) index += tag.length;
            tokens.push({ kind: "body", value, line: tokenLine });
        } else if (/[\p{L}_]/u.test(character)) {
            const tokenLine = line;
            let value = advance();
            while (
                index < source.length &&
                /[\p{L}\p{N}_$]/u.test(source.charAt(index))
            )
                value += advance();
            tokens.push({ kind: "word", value, line: tokenLine });
        } else {
            const tokenLine = line;
            const value = source.startsWith("||", index)
                ? advance() + advance()
                : advance();
            tokens.push({ kind: "symbol", value, line: tokenLine });
        }
    }
    return tokens;
}

function isWord({
    token,
    word,
}: {
    token: Token | undefined;
    word: string;
}): boolean {
    return token?.kind === "word" && token.value.toUpperCase() === word;
}

function identifier(token: Token | undefined): string | undefined {
    if (token === undefined || token.value === DYNAMIC_SQL_EXPRESSION)
        return undefined;
    if (token.kind === "identifier") return token.value;
    return token.kind === "word" ? token.value.toLowerCase() : undefined;
}

function startsCommand({
    tokens,
    index,
}: {
    tokens: readonly Token[];
    index: number;
}): boolean {
    if (index === 0) return true;
    const previous = tokens.at(index - 1);
    return (
        previous === undefined ||
        (previous.kind === "symbol" &&
            [";", "(", ")"].includes(previous.value)) ||
        (previous.kind === "word" &&
            [
                "BEGIN",
                "THEN",
                "ELSE",
                "LOOP",
                "ATOMIC",
                "EXPLAIN",
                "ANALYZE",
                "VERBOSE",
            ].includes(previous.value.toUpperCase()))
    );
}

function readTarget({
    tokens,
    index,
}: {
    tokens: readonly Token[];
    index: number;
}): {
    readonly name: string | undefined;
    readonly schema: string | undefined;
    readonly next: number;
} {
    let cursor = index;
    if (isWord({ token: tokens.at(cursor), word: "ONLY" })) cursor++;
    const parenthesized = tokens.at(cursor)?.value === "(";
    if (parenthesized) cursor++;
    let name = identifier(tokens.at(cursor++));
    let schema: string | undefined;
    if (tokens.at(cursor)?.value === "&") name = undefined;
    if (tokens.at(cursor)?.value === ".") {
        schema = name;
        cursor++;
        name = identifier(tokens.at(cursor++));
    }
    if (tokens.at(cursor)?.value === ".") name = undefined;
    if (parenthesized && tokens.at(cursor)?.value === ")") cursor++;
    if (tokens.at(cursor)?.value === "*") cursor++;
    return { name, schema, next: cursor };
}

function inspectTokens({
    tokens,
    depth,
}: {
    tokens: readonly Token[];
    depth: number;
}): SqlFinding[] {
    const findings: SqlFinding[] = [];
    const temporaryTables = new Set<string>();
    let statementWords: string[] = [];
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens.at(index);
        if (token === undefined) break;
        if (token.value === ";") {
            statementWords = [];
            continue;
        }
        if (token.kind === "word" && statementWords.length < 4)
            statementWords.push(token.value.toUpperCase());
        if (
            isWord({ token, word: "CREATE" }) &&
            ["TEMP", "TEMPORARY"].some((word) =>
                isWord({ token: tokens.at(index + 1), word }),
            ) &&
            isWord({ token: tokens.at(index + 2), word: "TABLE" })
        ) {
            const start = isWord({ token: tokens.at(index + 3), word: "IF" })
                ? index + 6
                : index + 3;
            const target = readTarget({ tokens, index: start });
            if (target.name !== undefined && target.schema === undefined)
                temporaryTables.add(target.name);
        }

        const routine =
            statementWords[0] === "CREATE" &&
            (statementWords[1] === "FUNCTION" ||
                statementWords[1] === "PROCEDURE" ||
                (statementWords[1] === "OR" &&
                    statementWords[2] === "REPLACE" &&
                    (statementWords[3] === "FUNCTION" ||
                        statementWords[3] === "PROCEDURE")));
        if (
            (token.kind === "body" || token.kind === "literal") &&
            (statementWords[0] === "DO" ||
                (routine &&
                    isWord({ token: tokens.at(index - 1), word: "AS" })))
        ) {
            findings.push(
                ...inspectNested({
                    source: token.value,
                    line: token.line,
                    depth,
                }),
            );
        }
        if (
            startsCommand({ tokens, index }) &&
            isWord({ token, word: "EXECUTE" }) &&
            tokens.at(index + 1) !== undefined &&
            !isWord({ token: tokens.at(index + 1), word: "FUNCTION" }) &&
            !isWord({ token: tokens.at(index + 1), word: "PROCEDURE" }) &&
            statementWords[0] !== "GRANT"
        ) {
            let cursor = index + 1;
            const formatted = isWord({
                token: tokens.at(cursor),
                word: "FORMAT",
            });
            if (formatted) cursor += 2;
            if (tokens.at(cursor)?.value === "(") cursor++;
            const first = tokens.at(cursor);
            if (first?.kind === "literal" || first?.kind === "body") {
                let value = first.value;
                cursor++;
                while (!formatted && tokens.at(cursor)?.value === "||") {
                    const part = tokens.at(cursor + 1);
                    value +=
                        part?.kind === "literal" || part?.kind === "body"
                            ? part.value
                            : DYNAMIC_SQL_EXPRESSION;
                    cursor += 2;
                }
                findings.push(
                    ...inspectNested({
                        source: value,
                        line: token.line,
                        depth,
                    }),
                );
            } else
                findings.push({
                    line: token.line,
                    operation: "Unresolved dynamic SQL",
                });
        }

        let operation: SqlOperation | undefined;
        let cursor = index + 1;
        if (
            isWord({ token, word: "DELETE" }) &&
            isWord({ token: tokens.at(cursor), word: "FROM" })
        ) {
            operation = "SQL DELETE";
            cursor++;
        } else if (isWord({ token, word: "TRUNCATE" })) {
            operation = "SQL TRUNCATE";
            if (isWord({ token: tokens.at(cursor), word: "TABLE" })) cursor++;
        } else if (
            isWord({ token, word: "DROP" }) &&
            isWord({ token: tokens.at(cursor), word: "TABLE" })
        ) {
            operation = "SQL DROP TABLE";
            cursor++;
            if (isWord({ token: tokens.at(cursor), word: "IF" })) cursor += 2;
        }
        if (
            operation === undefined ||
            cursor >= tokens.length ||
            !startsCommand({ tokens, index })
        )
            continue;
        let safe = true;
        do {
            const target = readTarget({ tokens, index: cursor });
            const temporary =
                target.name !== undefined &&
                (target.schema === undefined || target.schema === "pg_temp") &&
                temporaryTables.has(target.name);
            safe = safe && temporary;
            if (operation === "SQL DROP TABLE" && temporary)
                temporaryTables.delete(target.name);
            cursor = target.next;
            if (operation === "SQL DELETE" || tokens.at(cursor)?.value !== ",")
                break;
            cursor++;
        } while (cursor < tokens.length);
        if (!safe) findings.push({ line: token.line, operation });
    }
    return findings;
}

function inspectNested({
    source,
    line,
    depth,
}: {
    source: string;
    line: number;
    depth: number;
}): SqlFinding[] {
    if (depth >= 32) return [{ line, operation: "Unresolved dynamic SQL" }];
    return inspectTokens({ tokens: tokenize(source), depth: depth + 1 }).map(
        (finding) => ({
            ...finding,
            line: line + finding.line - 1,
        }),
    );
}

export function inspectSql(source: string): SqlFinding[] {
    return inspectTokens({ tokens: tokenize(source), depth: 0 });
}
