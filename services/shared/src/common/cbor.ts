import { encode, decode } from "cborg";
import { base64 } from "./index.js";

export function encodeCbor(obj: any): string {
    let data = encode(obj);
    return base64.encode(data);
}

export function decodeCbor(encodedData: string): unknown {
    const base64UrlDecoded = base64.decode(encodedData);
    const decodedCbor = decode(base64UrlDecoded);
    return decodedCbor;
}
