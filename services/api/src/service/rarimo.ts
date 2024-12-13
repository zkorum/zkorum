// This file, along with the integration of the Rarimo protocol into Agora, was originally developed with funding from the European Union’s Horizon Europe 2020 research and innovation program, as part of the NGI SARGASSO project under grant agreement No. 101092887.

import { deviceTable, passportTable } from "@/schema.js";
import type { VerifyUserStatusAndAuthenticate200 } from "@/shared/types/dto.js";
import {
    type RarimoStatusAttributes,
} from "@/shared/types/zod.js";
import { type AxiosInstance } from "axios";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { nowZeroMs } from "@/shared/common/util.js";
import { generateUUID } from "@/crypto.js";
import {
    loginKnownDevice,
    loginNewDevice,
    registerWithRarimo,
} from "@/service/auth.js";
import type { HttpErrors } from "@fastify/sensible";
import { log } from "@/app.js";

interface GenerateVerificationLinkProps {
    didWrite: string;
    axiosVerificatorSvc: AxiosInstance;
    baseEventId: string;
}

// Representing the LinksAttributes structure
interface LinksAttributes {
    // Returns proof-parameters and callback_url
    get_proof_params: string;
}

// Representing the Links structure
interface Links {
    key: string; // Assuming "Key" maps to a string or could be replaced with a more specific type.
    attributes: LinksAttributes;
}

// Representing the VerificationLinksResponse structure
export interface VerificationLinksResponse {
    data: Links;
}

export async function generateVerificationLink({
    didWrite,
    axiosVerificatorSvc,
    baseEventId,
}: GenerateVerificationLinkProps): Promise<string> {
    const getVerificationLinkUrl =
        "/integrations/verificator-svc/light/private/verification-link";
    const userId = didWrite;
    const body = {
        data: {
            id: userId,
            type: "user",
            attributes: {
                age_lower_bound: 8,
                uniqueness: true,
                nationality_check: true,
                event_id: baseEventId,
                sex: true,
            },
        },
    };
    const response = await axiosVerificatorSvc.post<VerificationLinksResponse>(
        getVerificationLinkUrl,
        body,
        {
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
    const proofParams = response.data.data.attributes.get_proof_params;
    return `rarime://external?type=light-verification&proof_params_url=${proofParams}`;
}

interface UserParamsAttributes {
    // Lower user age limit
    ageLowerBound: number;
    // User nationality
    nationality: string;
    // User nullifier
    nullifier: string;
    // User sex
    sex: string;
}

interface UserParams {
    attributes: UserParamsAttributes;
}

interface UserParamsRequest {
    data: UserParams;
}

interface GetUserProofProps {
    didWrite: string;
    axiosVerificatorSvc: AxiosInstance;
}

interface GetUserProofReturn {
    nationality: string;
    nullifier: string;
    sex: string;
}

async function getUserProof({
    didWrite,
    axiosVerificatorSvc,
}: GetUserProofProps): Promise<GetUserProofReturn> {
    const getUserProofUrl = `/integrations/verificator-svc/light/private/user/${didWrite.toLowerCase()}`; // toLowerCase is a work-around because verificator-svc does it when inserting the userId in DB but not when selecting data from the DB! Missing toLowerCase() here would lead to a 404 error
    const response =
        await axiosVerificatorSvc.get<UserParamsRequest>(getUserProofUrl);
    const userParamsRequest: UserParamsRequest = response.data;
    log.info(`User params received: ${JSON.stringify(userParamsRequest.data)}`);
    return {
        nullifier: userParamsRequest.data.attributes.nullifier,
        sex: userParamsRequest.data.attributes.sex,
        nationality: userParamsRequest.data.attributes.nationality,
    };
}

interface StatusAttributes {
    status: RarimoStatusAttributes;
}

interface Status {
    attributes: StatusAttributes;
}

interface StatusResponse {
    data: Status;
}

interface VerifyUserStatusProps {
    db: PostgresDatabase;
    didWrite: string;
    axiosVerificatorSvc: AxiosInstance;
    userAgent: string;
    httpErrors: HttpErrors;
}

interface GetLoggedInStateProps {
    db: PostgresDatabase;
    nullifier: string;
    didWrite: string;
    now: Date;
}

interface GetLoggedInStateReturn {
    loggedInState: LoggedInState;
    userId: string;
}

type LoggedInState =
    | "not_registered"
    | "not_logged_in_new_device"
    | "not_logged_in_known_device"
    | "already_logged_in";

async function getLoggedInState({
    db,
    nullifier,
    didWrite,
    now,
}: GetLoggedInStateProps): Promise<GetLoggedInStateReturn> {
    const result = await db
        .select({
            didWrite: deviceTable.didWrite,
            sessionExpiry: deviceTable.sessionExpiry,
            userId: passportTable.userId,
        })
        .from(passportTable)
        .leftJoin(deviceTable, eq(deviceTable.userId, passportTable.userId))
        .where(
            and(
                eq(passportTable.nullifier, nullifier),
                eq(deviceTable.didWrite, didWrite),
            ),
        );
    if (result.length === 0) {
        return { loggedInState: "not_registered", userId: generateUUID() };
    } else {
        if (result[0].didWrite === null) {
            return {
                loggedInState: "not_logged_in_new_device",
                userId: result[0].userId,
            };
        }
        if (result[0].sessionExpiry !== null && result[0].sessionExpiry > now) {
            return {
                loggedInState: "already_logged_in",
                userId: result[0].userId,
            };
        } else {
            return {
                loggedInState: "not_logged_in_known_device",
                userId: result[0].userId,
            };
        }
    }
}

export async function verifyUserStatusAndAuthenticate({
    db,
    didWrite,
    axiosVerificatorSvc,
    userAgent,
}: VerifyUserStatusProps): Promise<VerifyUserStatusAndAuthenticate200> {
    const verifyUserStatusUrl = `/integrations/verificator-svc/light/private/verification-status/${didWrite.toLowerCase()}`; // toLowerCase is a work-around because verificator-svc does it when inserting the userId in DB but not when selecting data from the DB! Missing toLowerCase() here would lead to a 404 error. This one here is not necessary as verificator-svc is doing it already, but as a safety measure I added this for now.
    const response =
        await axiosVerificatorSvc.get<StatusResponse>(verifyUserStatusUrl);
    const statusResponse: StatusResponse = response.data;
    const rarimoStatus = statusResponse.data.attributes.status;
    if (rarimoStatus !== "verified") {
        return { rarimoStatus };
    }
    // retrieve the user attributes
    const { nationality, sex, nullifier } = await getUserProof({
        didWrite,
        axiosVerificatorSvc,
    });
    const now = nowZeroMs();
    // verify if the nullifier is already associated with an existing user
    const { loggedInState, userId } = await getLoggedInState({
        db,
        nullifier,
        didWrite,
        now,
    });
    // log-in or register depending on the state
    const loginSessionExpiry = new Date(now);
    loginSessionExpiry.setFullYear(loginSessionExpiry.getFullYear() + 1000);
    switch (loggedInState) {
        case "already_logged_in":
            break;
        case "not_logged_in_new_device":
            await loginNewDevice({
                db,
                didWrite,
                userId,
                userAgent,
                now,
                sessionExpiry: loginSessionExpiry,
            });
            break;
        case "not_logged_in_known_device":
            await loginKnownDevice({
                db,
                didWrite,
                now,
                sessionExpiry: loginSessionExpiry,
            });
            break;
        case "not_registered": {
            // const parsedCitizenship = zodCountryCodeEnum.safeParse(nationality);
            // if (!parsedCitizenship.success) {
            //     throw httpErrors.internalServerError(
            //         `Received nationality ${nationality} is not part of expected enum`,
            //     );
            // }
            await registerWithRarimo({
                db,
                didWrite,
                citizenship: nationality,
                nullifier,
                sex: sex,
                userAgent,
                userId,
                sessionExpiry: loginSessionExpiry,
                username: "TEST_USER", //TODO: generte random username instead, while waiting for the user to choose another one during onboarding
            });
            break;
        }
    }
    return { rarimoStatus };
}
