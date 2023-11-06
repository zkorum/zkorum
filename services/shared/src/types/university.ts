/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { type TCountryCode, countries as allCountries } from "countries-list";
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

export function universityStringToType(universityStr: string): UniversityType {
    switch (universityStr) {
        case "Student":
            return UniversityType.STUDENT;
        case "Alum":
            return UniversityType.ALUM;
        case "Faculty/Staff member":
            return UniversityType.FACULTY;
        default:
            throw new Error(
                `String '${universityStr}' cannot be parsed to university type`
            );
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

export function studentPersonaToString(studentPersona: StudentPersona): string {
    const campusToStr =
        studentPersona.campus !== undefined
            ? `in ${essecCampusToString(studentPersona.campus)}`
            : "";
    const programToStr =
        studentPersona.program !== undefined
            ? `at ${essecProgramToString(studentPersona.program)}`
            : "";
    let countriesStr = "";
    if (studentPersona.countries !== undefined) {
        const countryNames = studentPersona.countries.map(
            (countryCode) => allCountries[countryCode].name
        );
        countriesStr = `from ${countryNames.join(", ")}`;
    }
    const admissionYearStr =
        studentPersona.admissionYear !== undefined
            ? `admitted in ${studentPersona.admissionYear}`
            : "";
    let res = `a student ${admissionYearStr}`.trim();
    res = `${res} ${programToStr}`.trim();
    res = `${res} ${campusToStr}`.trim();
    res = `${res} ${countriesStr}`.trim();
    return res;
}

// this is a huge work-around that doens't scale but it doens't the job for now
export function calculateAllStudentPersonas(): StudentPersona[] {
    const studentPersonas: StudentPersona[] = [];
    for (const campusKey of [...Object.keys(EssecCampus), undefined]) {
        const campus: EssecCampus | undefined =
            campusKey !== undefined ? parseInt(campusKey) : undefined;
        if (campus === undefined || !isNaN(campus)) {
            studentPersonas.push({
                campus: campus,
            });
            for (const programKey of [
                ...Object.keys(EssecProgram),
                undefined,
            ]) {
                const program: EssecProgram | undefined =
                    programKey !== undefined ? parseInt(programKey) : undefined;
                if (program === undefined || !isNaN(program)) {
                    studentPersonas.push({
                        campus: campus,
                        program: program,
                    });
                }
                for (const countryCode of [
                    ...Object.keys(allCountries),
                    undefined,
                ]) {
                    // TODO: put all combinations of possible countries...
                    studentPersonas.push({
                        campus: campus,
                        program: program,
                        countries:
                            countryCode !== undefined
                                ? [countryCode as TCountryCode]
                                : undefined,
                    });
                    for (const admissionYear of [
                        ...currentStudentsAdmissionYears,
                        undefined,
                    ]) {
                        studentPersonas.push({
                            campus: campus,
                            program: program,
                            countries:
                                countryCode !== undefined
                                    ? [countryCode as TCountryCode]
                                    : undefined,
                            admissionYear: admissionYear,
                        });
                    }
                }
            }
        }
    }
    const uniqueStudentPersonas = Array.from(new Set(studentPersonas));
    const uniqueNotAllUndefinedStudentPersonas = uniqueStudentPersonas.filter(
        (persona: StudentPersona) =>
            !Object.values(persona).every((val) => val === undefined)
    );
    const attributes = ["campus", "program", "countries", "admissionYear"];
    uniqueNotAllUndefinedStudentPersonas.forEach(function (persona, index) {
        for (const attribute of attributes) {
            if (!(attribute in persona)) {
                uniqueNotAllUndefinedStudentPersonas.splice(index, 1);
            }
        }
    });
    return uniqueNotAllUndefinedStudentPersonas;
}

export function studentPersonasFrom(
    studentData: StudentData | null
): StudentPersona[] {
    if (studentData === null) {
        return [];
    }
    const allStudentPersonas: StudentPersona[] = calculateAllStudentPersonas();
    const filteredStudentPersonas = allStudentPersonas.filter(
        (persona: StudentPersona) =>
            (persona.admissionYear === undefined ||
                persona.admissionYear === studentData.admissionYear) &&
            (persona.countries === undefined ||
                persona.countries.every((country) =>
                    studentData.countries.includes(country)
                )) &&
            (persona.program === undefined ||
                persona.program === studentData.program) &&
            (persona.campus === undefined ||
                persona.campus === studentData.campus)
    );
    console.log("filtered", filteredStudentPersonas);
    return filteredStudentPersonas;
}

export enum UniversityType {
    STUDENT,
    ALUM,
    FACULTY,
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
