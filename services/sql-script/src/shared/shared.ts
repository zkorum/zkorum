/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
// Copyright ts-odd team
// Apache v2 License
// Extracted from: https://github.com/oddsdk/ts-odd/tree/f90bde37416d9986d1c0afed406182a95ce7c1d7
import localforage from "localforage";
import {
    BBSPlusCredential as Credential,
    SUBJECT_STR,
} from "@docknetwork/crypto-wasm-ts";
import { scopeWith } from "./common/util.js";
import type {
    Eligibilities,
    ResponseToPoll,
    ResponseToPollPayload,
    UniversityType,
} from "./types/zod.js";
import type { TCountryCode } from "countries-list";
import { toEncodedCID } from "./common/cid.js";

/**
 * Is this browser supported?
 */
export async function isSupported(): Promise<boolean> {
    return (
        localforage.supports(localforage.INDEXEDDB) &&
        // Firefox in private mode can't use indexedDB properly,
        // so we test if we can actually make a database.
        ((await (() =>
            new Promise((resolve) => {
                const db = indexedDB.open("testDatabase");
                db.onsuccess = () => resolve(true);
                db.onerror = () => resolve(false);
            }))()) as boolean)
    );
}

export enum ProgramError {
    InsecureContext = "INSECURE_CONTEXT",
    UnsupportedBrowser = "UNSUPPORTED_BROWSER",
}

interface DomainAndExtension {
    domainName?: string;
    domainExtension?: string;
}

export function domainNameAndExtensionFromEmail(
    email: string
): DomainAndExtension {
    const domain = domainFromEmail(email);
    if (domain === undefined) {
        return { domainName: undefined, domainExtension: undefined };
    } else {
        const domainNameAndDomainExtension = domain.split(".");
        if (domainNameAndDomainExtension.length === 2) {
            const [domainName, domainExtension] = domainNameAndDomainExtension;
            return { domainName, domainExtension };
        } else {
            return { domainName: undefined, domainExtension: undefined };
        }
    }
}

export function domainFromEmail(email: string): string | undefined {
    const nameAndDomain = email.split("@");
    if (nameAndDomain.length === 2) {
        const [_username, domain] = [nameAndDomain[0], nameAndDomain[1]];
        return domain;
    }
}

// WARNING: this is also used in schema.ts and cannot be imported there so it was copy-pasted
// IF YOU CHANGE THESE VALUES ALSO CHANGE THEM IN SCHEMA.TS
export const MAX_LENGTH_OPTION = 30;
export const MAX_LENGTH_TITLE = 140;

export function toUnionUndefined<T>(value: T | null): T | undefined {
    if (value === null) {
        return undefined;
    }
    return value;
}

interface AddIfExistsProps {
    credential: Credential;
    attribute: string;
    set: Set<string>;
}

function addIfExists({ credential, attribute, set }: AddIfExistsProps) {
    const flattenedSchemaAttributes = credential.schema.flatten()[0];
    const flattenedSchemaAttributesFiltered = flattenedSchemaAttributes.filter(
        (attr) => attr.includes(attribute)
    );
    if (flattenedSchemaAttributesFiltered.length !== 0) {
        set.add(attribute);
    } else {
        console.warn(
            `Cannot reveal attribute '${attribute}' that is not in schema`,
            flattenedSchemaAttributes
        );
    }
}

export interface PostAsProps {
    postAsStudent: boolean;
    postAsAlum: boolean;
    postAsFaculty: boolean;
    postAsCampus: boolean;
    postAsProgram: boolean;
    postAsAdmissionYear: boolean;
    postAsCountries: boolean;
}

interface AttributesFormRevealedFromPostAsProps {
    postAs: PostAsProps;
    credential: Credential;
}

export function attributesFormRevealedFromPostAs({
    postAs,
    credential,
}: AttributesFormRevealedFromPostAsProps): Set<string> {
    const {
        postAsStudent,
        postAsAlum,
        postAsFaculty,
        postAsCampus,
        postAsProgram,
        postAsAdmissionYear,
        postAsCountries,
    } = postAs;
    const attributesRevealed = new Set<string>();
    if (postAsStudent || postAsAlum || postAsFaculty) {
        addIfExists({
            attribute: `${SUBJECT_STR}.typeSpecific.type`,
            credential: credential,
            set: attributesRevealed,
        });
    }
    if (postAsCampus) {
        addIfExists({
            attribute: `${SUBJECT_STR}.typeSpecific.campus`,
            credential: credential,
            set: attributesRevealed,
        });
    }
    if (postAsProgram) {
        addIfExists({
            attribute: `${SUBJECT_STR}.typeSpecific.program`,
            credential: credential,
            set: attributesRevealed,
        });
    }
    if (postAsAdmissionYear) {
        addIfExists({
            attribute: `${SUBJECT_STR}.typeSpecific.admissionYear`,
            credential: credential,
            set: attributesRevealed,
        });
    }
    if (postAsCountries) {
        const attrCountries = (
            (credential.subject as any)["typeSpecific"] as any
        )[ // TODO: countries should not be in typeSpecific
            `countries`
        ];
        const justMyCountries = Object.keys(
            attrCountries as { [key: string]: boolean }
        ).filter((key) => attrCountries[key] === true);
        for (const countryCode of justMyCountries) {
            addIfExists({
                attribute: `${SUBJECT_STR}.typeSpecific.countries.${countryCode}`,
                credential: credential,
                set: attributesRevealed,
            });
        }
    }
    return attributesRevealed;
}

export function scopeFromPostAs({
    postAsStudent,
    postAsAlum,
    postAsFaculty,
    postAsCampus,
    postAsProgram,
    postAsAdmissionYear,
    postAsCountries,
}: PostAsProps): string {
    let scope = "base";
    if (postAsStudent) {
        scope = scopeWith(scope, "student");
    }
    if (postAsAlum) {
        scope = scopeWith(scope, "alum");
    }
    if (postAsFaculty) {
        scope = scopeWith(scope, "faculty");
    }
    if (postAsCampus) {
        scope = scopeWith(scope, "campus");
    }
    if (postAsProgram) {
        scope = scopeWith(scope, "program");
    }
    if (postAsAdmissionYear) {
        scope = scopeWith(scope, "admissionYear");
    }
    if (postAsCountries) {
        scope = scopeWith(scope, "countries");
    }
    return scope;
}

interface PostAsFromEligibility {
    eligibility: Eligibilities;
    type: UniversityType | undefined;
    mustPostAsForCampus: boolean;
    mustPostAsForProgram: boolean;
    mustPostAsForAdmissionYear: boolean;
    mustPostAsForCountries: boolean;
}

export function postAsFromEligibility({
    eligibility,
    type,
    mustPostAsForCampus,
    mustPostAsForProgram,
    mustPostAsForAdmissionYear,
    mustPostAsForCountries,
}: PostAsFromEligibility): PostAsProps {
    const postAs = {
        postAsStudent: false,
        postAsFaculty: false,
        postAsAlum: false,
        postAsCampus: false,
        postAsProgram: false,
        postAsAdmissionYear: false,
        postAsCountries: false,
    };
    if (eligibility?.university?.types === undefined || type === undefined) {
        return postAs;
    }
    return {
        postAsStudent: type === "student" ? true : false,
        postAsFaculty: type === "faculty" ? true : false,
        postAsAlum: type === "alum" ? true : false,
        postAsCampus: mustPostAsForCampus,
        postAsProgram: mustPostAsForProgram,
        postAsAdmissionYear: mustPostAsForAdmissionYear,
        postAsCountries: mustPostAsForCountries,
    };
}

export function mustPostAsForList<T>(
    value?: T,
    eligibilityList?: T[]
): boolean {
    return isEligibleForList(value, eligibilityList, false);
}

export function mustPostAsForCountries(
    countries?: Record<TCountryCode, boolean>,
    eligibilityCountries?: TCountryCode[]
): boolean {
    return isEligibleForCountries(countries, eligibilityCountries, false);
}

export function isEligibleForList<T>(
    value: T,
    eligibilityList: T[] | undefined,
    returnedValueIfListUndefined: boolean = true
): boolean {
    if (eligibilityList === undefined) {
        return returnedValueIfListUndefined;
    }
    if (value === undefined) {
        return false;
    } else {
        if (eligibilityList.includes(value)) {
            return true;
        } else {
            return false;
        }
    }
}

export function isEligibleForCountries(
    countries?: Partial<Record<TCountryCode, boolean>>,
    eligibilityCountries?: TCountryCode[],
    returnedValueIfListUndefined: boolean = true
): boolean {
    if (eligibilityCountries === undefined) {
        return returnedValueIfListUndefined;
    }
    if (countries === undefined) {
        return false;
    } else {
        const myCountryCodes = Object.keys(countries).filter(
            (countryCode) => countries[countryCode as TCountryCode] === true
        );
        for (const eligibilityCountryCode of eligibilityCountries) {
            if (myCountryCodes.includes(eligibilityCountryCode)) {
                return true;
            }
        }
        return false;
    }
}

export async function buildContext(content: string): Promise<string> {
    return await toEncodedCID(content);
}

export function buildResponseToPollFromPayload(
    payload: ResponseToPollPayload
): ResponseToPoll {
    return {
        metadata: {
            action: "respondToPoll",
        },
        payload: payload,
    };
}
