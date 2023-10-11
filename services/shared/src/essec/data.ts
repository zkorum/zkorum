import { range } from "../common/util.js";

const currentYear = new Date().getFullYear();
export const currentStudentsAdmissionYears = range(
    currentYear - 9,
    currentYear + 1
);
