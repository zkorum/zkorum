import { universityTypeToString } from "@/shared/types/university";
import type { Eligibilities, PostAs } from "@/shared/types/zod";

export function getTimeFromNow(time: Date): string {
    const now = new Date();
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

export function getFromAuthor(postAs: PostAs): string {
    if (postAs.university === undefined) {
        return "a member";
    }
    const university = postAs.university;
    return `a ${universityTypeToString(university.type)}`;
}

export function getToEligibility(eligibility: Eligibilities): string {
    if (
        eligibility === undefined ||
        eligibility.university === undefined ||
        eligibility.university.types === undefined ||
        (eligibility.university.types.length === 3 &&
            eligibility.university.student === undefined)
    ) {
        return "any member";
    }
    const universityTypes = eligibility.university.types;
    if (
        universityTypes.includes("student") &&
        eligibility.university.student !== undefined
    ) {
        // means that there are certain rules
        const otherThanStudentsTypes = universityTypes.filter(
            (type) => type !== "student"
        );
        if (otherThanStudentsTypes.length === 0) {
            return `some students`;
        }
        if (universityTypes.length === 3) {
            return `some students and any other member`;
        }
        return `some students and any ${otherThanStudentsTypes.join(
            " or "
        )} member`;
    }
    return `any ${universityTypes.join(" or ")} member`;
}
