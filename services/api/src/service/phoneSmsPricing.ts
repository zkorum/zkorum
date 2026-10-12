import {
    phoneCountrySchema,
    type PhoneCountry,
} from "@/shared/types/phone-country-policy.js";
import { z } from "zod";

// October 2026 published SMS rates in millionths of a USD, avoiding floating
// price parsing. Review actual Verify/carrier charges when updating these rates.
// https://assets.cdn.prod.twilio.com/pricing-csv/SMSPricing.csv
// IO has no published quote. Use the reviewed global CSV maximum as its explicit
// conservative estimate, rather than treating it as a quoted destination rate.
const unquotedTerritorySegmentPriceMicros = 784900;
const legacyNetherlandsAntillesSegmentPriceMicros = 172300;
// These territories share the provider billing route of their numbering region.
const territoryBillingCountries: Readonly<
    Partial<Record<PhoneCountry, PhoneCountry>>
> = {
    AX: "FI",
    IM: "GB",
    MF: "GP",
    SJ: "NO",
    VA: "IT",
};
const segmentPriceMicros: Readonly<Partial<Record<PhoneCountry, number>>> = {
    AD: 146400,
    AE: 117600,
    AL: 116700,
    AR: 103400,
    AS: 188100,
    AT: 97900,
    AU: 51500,
    BA: 511000,
    BD: 596200,
    BE: 111300,
    BG: 146600,
    BQ: legacyNetherlandsAntillesSegmentPriceMicros,
    BR: 59900,
    BY: 252100,
    CA: 8300,
    CH: 76900,
    CM: 317000,
    CW: legacyNetherlandsAntillesSegmentPriceMicros,
    CY: 86400,
    CZ: 70600,
    DE: 112000,
    DK: 59200,
    EE: 95800,
    ES: 87500,
    FI: 86100,
    FO: 71700,
    FR: 79800,
    GB: 56000,
    GE: 168400,
    GG: 52400,
    GI: 122500,
    GL: 41000,
    GP: 227400,
    GR: 65700,
    GW: 472200,
    HK: 72300,
    HR: 137900,
    HU: 91000,
    IE: 77900,
    IN: 83200,
    IO: unquotedTerritorySegmentPriceMicros,
    IS: 71900,
    IT: 92700,
    JE: 52400,
    JP: 89000,
    KE: 313400,
    KG: 458800,
    KR: 52400,
    LI: 36200,
    LT: 57800,
    LU: 81800,
    LV: 80100,
    MC: 185600,
    MD: 147400,
    ME: 192800,
    MK: 201200,
    MQ: 189700,
    MT: 68900,
    MX: 181900,
    NC: 176100,
    NG: 386800,
    NL: 114300,
    NO: 69700,
    NZ: 105000,
    PF: 179700,
    PL: 45700,
    PM: 159700,
    PT: 50100,
    RE: 191100,
    RO: 78100,
    RS: 409800,
    SE: 64600,
    SG: 59100,
    SI: 205100,
    SK: 88300,
    SM: 125600,
    SX: legacyNetherlandsAntillesSegmentPriceMicros,
    TH: 30500,
    TW: 84200,
    UA: 226800,
    US: 8300,
    VG: 308000,
    VI: 198700,
    VN: 285200,
    XK: 250900,
};

export function getDefaultPhoneSmsCostCents(
    country: PhoneCountry,
): number | undefined {
    const price =
        segmentPriceMicros[territoryBillingCountries[country] ?? country];
    if (price === undefined) return undefined;
    // Two segments, the 5-cent Verify fee on every attempt, and 20% headroom.
    // The 15-cent floor leaves extra room on inexpensive North American routes.
    return Math.max(15, Math.ceil(((2 * price + 50_000) * 120) / 1_000_000));
}

export const phoneSmsCostOverridesSchema = z.partialRecord(
    phoneCountrySchema,
    z.number().int().min(1).max(2_147_483_647),
);
