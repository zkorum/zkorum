/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import * as uint8arrays from 'uint8arrays'

export function decode(base64: string): string {
    return uint8arrays.toString(uint8arrays.fromString(base64, 'base64url'))
}

export function encode(str: string): string {
    return uint8arrays.toString(uint8arrays.fromString(str), 'base64url')
}

export function urlDecode(base64: string): string {
    return decode(makeUrlUnsafe(base64))
}

export function urlEncode(str: string): string {
    return makeUrlSafe(encode(str))
}

export function makeUrlSafe(a: string): string {
    return a.replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '')
}

export function makeUrlUnsafe(a: string): string {
    return a.replace(/_/g, '/').replace(/-/g, '+')
}
