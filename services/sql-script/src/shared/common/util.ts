/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
export function range(startAt: number, endAt: number): ReadonlyArray<number> {
    if (endAt < startAt) {
        return [];
    }
    return [...Array(endAt - startAt + 1).keys()].map((i) => endAt - i);
}

export function removeUndefinedFields(obj: { [key: string]: any }) {
    Object.keys(obj).forEach((key) =>
        obj[key] === undefined ? delete obj[key] : {}
    );
}

export function scopeWith(scope: string, withValue: string): string {
    return `${scope}.${withValue}`;
}
