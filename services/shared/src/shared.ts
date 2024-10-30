// Copyright ts-odd team
// Apache v2 License
// Extracted from: https://github.com/oddsdk/ts-odd/tree/f90bde37416d9986d1c0afed406182a95ce7c1d7
import localforage from "localforage";
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
                db.onsuccess = () => { resolve(true); };
                db.onerror = () => { resolve(false); };
            }))()))
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_username, domain] = [nameAndDomain[0], nameAndDomain[1]];
        return domain;
    }
}

// WARNING: this is also used in schema.ts and cannot be imported there so it was copy-pasted
// IF YOU CHANGE THESE VALUES ALSO CHANGE THEM IN SCHEMA.TS
export const MAX_LENGTH_OPTION = 30;
export const MAX_LENGTH_TITLE = 130; // 140 is LinkedIn question limit
export const MAX_LENGTH_BODY = 260;
export const MAX_LENGTH_NAME_CREATOR = 65;
export const MAX_LENGTH_COMMENT = 280; // tweet and community notes max length

export function toUnionUndefined<T>(value: T | null): T | undefined {
    if (value === null) {
        return undefined;
    }
    return value;
}

export const BASE_SCOPE = "base";

export async function buildContext(content: string): Promise<string> {
    return await toEncodedCID(content);
}

export interface ToxicityClassification {
    toxicity: number;
    severe_toxicity: number;
    obscene: number;
    identity_attack: number;
    insult: number;
    threat: number;
    sexual_explicit: number;
}
