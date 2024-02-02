import { nowZeroMs } from "@/shared/common/util";

export function getTimeFromNow(time: Date): string {
    const now = nowZeroMs();
    const difference = now.getTime() - time.getTime();
    const differenceSeconds = difference / 1000;
    if (differenceSeconds <= 59) {
        return "now";
    }
    const differenceMinutes = differenceSeconds / 60;
    if (differenceMinutes < 59) {
        let mn = 1;
        while (differenceMinutes <= mn === false) {
            mn += 1;
        }
        return `${mn}mn`;
    }
    const differenceHours = differenceMinutes / 60;
    if (differenceHours < 24) {
        let h = 1;
        while (differenceHours <= h === false) {
            h += 1;
        }
        return `${h}h`;
    }
    const differenceDays = differenceHours / 24;
    if (differenceDays < 30) {
        let d = 1;
        while (differenceDays <= d === false) {
            d += 1;
        }
        return `${d}d`;
    }
    const differenceMonths = differenceDays / 365;
    if (differenceMonths < 12) {
        let m = 1;
        while (differenceMonths <= m === false) {
            m += 1;
        }
        return `${m}m`;
    }
    const differenceYears = differenceMonths / 12;
    let y = 1;
    while (differenceYears <= y === false) {
        y += 1;
    }
    return `${y}y`;
}

export function zeroIfUndefined(value: number | undefined): number {
    if (value === undefined) {
        return 0;
    }
    return value;
}

export function getTrimmedPseudonym(pseudo: string) {
    return pseudo.substring(0, 7);
}

export async function persistData(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
        return await navigator.storage.persist();
    } else {
        console.warn("The browser does not support persistence");
        return false;
    }
}

export async function isDataPersisted(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persisted) {
        return await navigator.storage.persisted();
    } else {
        console.warn("The browser does not support persistence");
        return false;
    }
}
