/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
// Copyright ts-odd team
// Apache v2 License
// Initially extracted from: https://github.com/oddsdk/ts-odd/tree/f90bde37416d9986d1c0afed406182a95ce7c1d7
import { base64 } from "../common/index.js";

/**
 * Given a UCAN, lookup the root issuer.
 *
 * Throws when given an improperly formatted UCAN.
 * This could be a nested UCAN (ie. proof).
 *
 * @param ucan A UCAN.
 * @returns The root issuer.
 */
export function rootIssuer(ucan: string, level = 0): string {
  const p = extractPayload(ucan, level);
  if (p.prf) return rootIssuer(p.prf, level + 1);
  return p.iss;
}

/**
 * Extract the payload of a UCAN.
 *
 * Throws when given an improperly formatted UCAN.
 */
function extractPayload(
  ucan: string,
  level: number
): { iss: string; prf: string | null } {
  try {
    return JSON.parse(base64.urlDecode(ucan.split(".")[1]));
  } catch (_) {
    throw new Error(
      `Invalid UCAN (${level} level${level === 1 ? "" : "s"} deep): \`${ucan}\``
    );
  }
}

export function httpUrlToResourcePointer(url: URL | string): {
  scheme: string;
  hierPart: string;
} {
  let urlVal: URL;
  if (url instanceof URL) {
    urlVal = url;
  } else {
    urlVal = new URL(url);
  }
  const scheme = urlVal.protocol.slice(0, -1);
  const hierPart = `//${urlVal.hostname}${urlVal.pathname};`;
  return { scheme, hierPart };
}
