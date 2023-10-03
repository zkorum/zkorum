/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import * as uint8arrays from "uint8arrays";

export function encode(value: Uint8Array): string {
    return uint8arrays.toString(value, "base64urlpad");
}

export function decode(str: string): Uint8Array {
    return uint8arrays.fromString(str, "base64urlpad");
}

export function decodeToStr(base64: string): string {
    return uint8arrays.toString(uint8arrays.fromString(base64, "base64urlpad"));
}

export function encodeFromStr(str: string): string {
    return uint8arrays.toString(uint8arrays.fromString(str), "base64urlpad");
}

export function urlDecode(base64: string): string {
    return decodeToStr(makeUrlUnsafe(base64));
}

export function urlEncode(str: string): string {
    return makeUrlSafe(encodeFromStr(str));
}

export function makeUrlSafe(a: string): string {
    return a.replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "");
}

export function makeUrlUnsafe(a: string): string {
    return a.replace(/_/g, "/").replace(/-/g, "+");
}
