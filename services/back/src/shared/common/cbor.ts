/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { encode, decode } from "cborg";
import { base64UrlEncode, base64UrlDecode } from "./base64.js";

export function encodeCbor(obj: any): string {
    let data = encode(obj);
    return base64UrlEncode(data);
}

export function decodeCbor(encodedData: string): unknown {
    const base64UrlDecoded = base64UrlDecode(encodedData);
    const decodedCbor = decode(base64UrlDecoded);
    return decodedCbor;
}
