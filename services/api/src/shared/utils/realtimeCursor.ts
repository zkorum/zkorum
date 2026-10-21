/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
const PREFIX = "delivery:";

export function formatRealtimeCursor(
    id: number | undefined,
): string | undefined {
    return id === undefined ? undefined : `${PREFIX}${String(id)}`;
}

export function parseRealtimeCursor(value: string | null): number | undefined {
    // Allocation cursors from older APIs cannot address delivery order.
    if (value === null || !/^delivery:[1-9]\d*$/.test(value)) return undefined;
    const id = Number(value.slice(PREFIX.length));
    return Number.isSafeInteger(id) ? id : undefined;
}

export function advanceRealtimeCursor({
    current,
    incoming,
}: {
    current: string | null;
    incoming: string;
}): string | null {
    if (incoming === "") return null;
    const nextId = parseRealtimeCursor(incoming);
    if (nextId === undefined) return current;
    const currentId = parseRealtimeCursor(current);
    return currentId === undefined || nextId > currentId ? incoming : current;
}
