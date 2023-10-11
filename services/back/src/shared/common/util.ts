/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
export function range(startAt: number, endAt: number): ReadonlyArray<number> {
    if (endAt < startAt) {
        return [];
    }
    return [...Array(endAt - startAt + 1).keys()].map((i) => endAt - i);
}
