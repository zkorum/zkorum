/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { type TCountryCode } from "countries-list";
import { type UniversityType, zoduniversityType } from "./zod.js";

export function universityTypeToString(universityType: UniversityType): string {
    switch (universityType) {
        case zoduniversityType.enum.student:
            return "Student";
        case zoduniversityType.enum.alum:
            return "Alum";
        case zoduniversityType.enum.faculty:
            return "Faculty/Staff member";
    }
}

export interface StudentPersona {
    campus?: EssecCampus;
    program?: EssecProgram;
    countries?: TCountryCode[];
    admissionYear?: number;
}

export interface StudentData {
    campus: EssecCampus;
    program: EssecProgram;
    countries: TCountryCode[];
    admissionYear: number;
}

export enum EssecCampus {
    CERGY,
    SINGAPORE,
    RABAT,
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

// TODO this is ugly af - ... whatever for now
export function essecCampusStrToEnum(campusStr: string): EssecCampus {
    switch (campusStr) {
        case "Cergy":
            return EssecCampus.CERGY;
        case "Singapore":
            return EssecCampus.SINGAPORE;
        default:
            return EssecCampus.RABAT;
    }
}

export function essecProgramToString(essecProgram: EssecProgram): string {
    switch (essecProgram) {
        case EssecProgram.BBA:
            return "BBA";
        case EssecProgram.MIM_AST:
            return "MiM / GE - AST";
        case EssecProgram.MIM_ASC:
            return "MiM / GE - ASC";
        case EssecProgram.OM:
            return "Other Masters";
        case EssecProgram.PHD:
            return "PhD";
        case EssecProgram.EXCHANGE:
            return "Exchange";
    }
}

// TODO this is ugly af - ... whatever for now
export function essecProgramStrToEnum(programStr: string): EssecProgram {
    switch (programStr) {
        case "BBA":
            return EssecProgram.BBA;
        case "MiM / GE - AST":
            return EssecProgram.MIM_AST;
        case "MiM / GE - ASC":
            return EssecProgram.MIM_ASC;
        case "Other Masters":
            return EssecProgram.OM;
        case "PhD":
            return EssecProgram.PHD;
        default:
            return EssecProgram.EXCHANGE;
    }
}

export enum EssecProgram {
    BBA,
    MIM_ASC,
    MIM_AST,
    OM,
    PHD,
    EXCHANGE,
}
