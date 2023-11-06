import { CID } from "multiformats/cid";
import * as json from "multiformats/codecs/json";
import { sha256 } from "multiformats/hashes/sha2";

export async function toCID(value: any): Promise<CID> {
    const bytes = json.encode(value);

    const hash = await sha256.digest(bytes);
    const cid = CID.create(1, json.code, hash);
    return cid;
}

export async function toEncodedCID(value: any): Promise<string> {
    const cid = await toCID(value);
    return cid.toString(); // default CIDv1 encoder
}

export function decodeCID(encodedCID: string): CID {
    return CID.parse(encodedCID);
}
