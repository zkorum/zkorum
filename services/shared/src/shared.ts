// Copyright ts-odd team
// Apache v2 License
// Extracted from: https://github.com/oddsdk/ts-odd/tree/f90bde37416d9986d1c0afed406182a95ce7c1d7
import localforage from "localforage";
import type {
    CreateCommentPayload,
    Post,
    ResponseToPoll,
    ResponseToPollPayload,
} from "./types/zod.js";
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
export const MAX_LENGTH_TITLE = 200; // 140 is LinkedIn question limit
export const MAX_LENGTH_COMMENT = 6000; // 2x post LinkedIn limit
export const MAX_LENGTH_BODY = 6000; // 2x post LinkedIn limit

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

export function buildCreatePostContextFromPayload(payload: Post) {
    return {
        metadata: {
            action: "create",
        },
        payload: payload,
    };
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

export function buildCreateCommentContextFromPayload(
    payload: CreateCommentPayload
) {
    return {
        metadata: {
            action: "createComment",
        },
        payload: payload,
    };
}
