/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { range } from "../common/util.js";

const currentYear = new Date().getFullYear();
export const minStudentYear = currentYear - 9;
export const maxStudentYear = currentYear + 1;
export const currentStudentsAdmissionYears = range(
    currentYear - 9,
    currentYear + 1
);

export function universityTypeToString(universityType: UniversityType): string {
    switch (universityType) {
        case UniversityType.STUDENT:
            return "Student";
        case UniversityType.ALUM:
            return "Alum";
        case UniversityType.FACULTY:
            return "Faculty/Staff member";
    }
}

export enum UniversityType {
    STUDENT,
    ALUM,
    FACULTY,
}

export function essecCampusToString(essecCampus: EssecCampus): string {
    switch (essecCampus) {
        case EssecCampus.CERGY:
            return "Cergy";
        case EssecCampus.SINGAPORE:
            return "Singapore";
        case EssecCampus.RABAT:
            return "Rabat";
    }
}

export enum EssecCampus {
    CERGY,
    SINGAPORE,
    RABAT,
}

export function essecProgramToString(essecProgram: EssecProgram): string {
    switch (essecProgram) {
        case EssecProgram.BBA:
            return "BBA";
        case EssecProgram.MIM:
            return "MIM / GE";
        case EssecProgram.OM:
            return "Other Masters";
        case EssecProgram.PHD:
            return "PhD";
        case EssecProgram.EXCHANGE:
            return "Exchange";
    }
}

export enum EssecProgram {
    BBA,
    MIM,
    OM,
    PHD,
    EXCHANGE,
}
