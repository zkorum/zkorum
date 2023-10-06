import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { and, eq, gt, inArray, isNotNull } from "drizzle-orm";
import {
    authAttemptTable,
    credentialEmailTable,
    credentialSecretTable,
    deviceTable,
    emailTable,
    userTable,
} from "../schema.js";
import {
    type AuthenticateRequestBody,
    type GetDeviceStatusResp,
    type IsLoggedInResponse,
    type UserCredentials,
    type VerifyOtp200,
} from "../dto.js";
import {
    codeToString,
    generateOneTimeCode,
    generateRandomHex,
    generateUUID,
} from "../crypto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { BBSPlusSecretKey as SecretKey } from "@docknetwork/crypto-wasm-ts";
import { buildEmailCredential } from "./credential.js";
import type {
    Devices,
    EmailCredentialsPerEmail,
    SecretCredentialsPerType,
} from "../shared/types/zod.js";

export interface AuthenticateOtp {
    codeExpiry: Date;
    nextCodeSoonestTime: Date;
}

// should be up to date with DB value
// TODO: automatically sync them - use one type only
export enum AuthenticateType {
    REGISTER = "register",
    LOGIN_KNOWN_DEVICE = "login_known_device",
    LOGIN_NEW_DEVICE = "login_new_device",
}

interface AuthTypeAndUserId {
    userId: string;
    type: AuthenticateType;
}

// No need to validate data, it has been done in the controller level
export class Service {
    static async getAuthenticateType(
        db: PostgresDatabase,
        authenticateBody: AuthenticateRequestBody,
        didWrite: string,
        httpErrors: HttpErrors
    ): Promise<AuthTypeAndUserId> {
        const isEmailAvailable = await Service.isEmailAvailable(
            db,
            authenticateBody.email
        );
        const isDidWriteAvailable = await Service.isDidWriteAvailable(
            db,
            didWrite
        );
        const isDidExchangeAvailable = await Service.isDidExchangeAvailable(
            db,
            authenticateBody.didExchange
        );
        if (isDidWriteAvailable !== isDidExchangeAvailable) {
            throw httpErrors.forbidden(
                `[MITM] Either didWrite or didExchange is unavailable: isEmailAvailable=${isEmailAvailable}, isDidWriteAvailable=${isDidWriteAvailable}, isDidExchangeAvailable=${isDidExchangeAvailable}`
            );
            // we can now safely ignore isDidExchangeAvailable in our AND clauses because it is equal to isDidWriteAvailable
        }

        const userId = await Service.getUserId(db, authenticateBody.email);
        if (isEmailAvailable && isDidWriteAvailable) {
            return { type: AuthenticateType.REGISTER, userId: userId };
        } else if (!isEmailAvailable && isDidWriteAvailable) {
            return { type: AuthenticateType.LOGIN_NEW_DEVICE, userId: userId };
        } else if (!isEmailAvailable && !isDidWriteAvailable) {
            await this.throwIfAwaitingSyncingOrLoggedIn(
                db,
                didWrite,
                httpErrors
            );
            return {
                type: AuthenticateType.LOGIN_KNOWN_DEVICE,
                userId: userId,
            };
        } else {
            // if (!isEmailAvailable && isDidWriteAvailable) {
            throw httpErrors.forbidden(
                `DIDs are associated with another email address`
            );
        }
    }

    static async getUserId(
        db: PostgresDatabase,
        email: string
    ): Promise<string> {
        const result = await db
            .select({ userId: userTable.id })
            .from(userTable)
            .leftJoin(emailTable, eq(emailTable.userId, userTable.id))
            .where(eq(emailTable.email, email));
        if (result.length === 0) {
            // The email is not associated with any existing user
            // But maybe it was already used to attempt a register
            const resultAttempt = await db
                .select({ userId: authAttemptTable.userId })
                .from(authAttemptTable)
                .where(eq(authAttemptTable.email, email));
            if (resultAttempt.length === 0) {
                // this email has never been used to attempt a register
                return generateUUID();
            } else {
                // at this point every userId in attempts should be identical, by design
                return resultAttempt[0].userId;
            }
        } else {
            return result[0].userId;
        }
    }

    static async getDeviceStatus(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<GetDeviceStatusResp> {
        const now = new Date();
        const resultDevice = await db
            .select({
                userId: deviceTable.userId,
                sessionExpiry: deviceTable.sessionExpiry,
                encryptedSymmKey: deviceTable.encryptedSymmKey,
            })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (resultDevice.length === 0) {
            // device has never been registered
            return undefined;
        } else if (resultDevice[0].encryptedSymmKey === null) {
            return {
                userId: resultDevice[0].userId,
                isLoggedIn: resultDevice[0].sessionExpiry > now,
                isSyncing: false,
            };
        } else {
            return {
                userId: resultDevice[0].userId,
                isLoggedIn: resultDevice[0].sessionExpiry > now,
                isSyncing: true,
                encryptedSymmKey: resultDevice[0].encryptedSymmKey,
            };
        }
    }

    static async throwIfAwaitingSyncingOrLoggedIn(
        db: PostgresDatabase,
        didWrite: string,
        httpErrors: HttpErrors
    ): Promise<GetDeviceStatusResp> {
        const deviceStatus = await Service.getDeviceStatus(db, didWrite);
        if (deviceStatus !== undefined) {
            if (!deviceStatus.isSyncing) {
                throw httpErrors.createError(409, "Conflict", {
                    reason: "awaiting_syncing",
                    userId: deviceStatus.userId,
                });
            } else if (deviceStatus.isLoggedIn) {
                const syncingDevices = await Service.getAllSyncingDidWrites(
                    db,
                    deviceStatus.userId
                );
                const emailCredentialsPerEmail =
                    await Service.getEmailCredentialsPerEmailFromUserId(
                        db,
                        deviceStatus.userId
                    );
                const secretCredentialsPerType =
                    await Service.getSecretCredentialsPerType(
                        db,
                        deviceStatus.userId
                    );
                throw httpErrors.createError(409, "Conflict", {
                    reason: "already_logged_in",
                    userId: deviceStatus.userId,
                    encryptedSymmKey: deviceStatus.encryptedSymmKey,
                    syncingDevices: syncingDevices,
                    emailCredentialsPerEmail: emailCredentialsPerEmail,
                    secretCredentialsPerType: secretCredentialsPerType,
                });
            }
        }
        return deviceStatus;
    }

    static async isLoggedIn(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<IsLoggedInResponse> {
        const now = new Date();
        const resultDevice = await db
            .select({ userId: deviceTable.userId })
            .from(deviceTable)
            .where(
                and(
                    eq(deviceTable.didWrite, didWrite),
                    gt(deviceTable.sessionExpiry, now)
                )
            );
        if (resultDevice.length === 0) {
            // device has never been registered OR device is logged out
            return { isLoggedIn: false };
        } else {
            return { isLoggedIn: true, userId: resultDevice[0].userId };
        }
    }

    static async isSyncing(db: PostgresDatabase, didWrite: string) {
        const resultDevice = await db
            .select({
                encryptedSymmKey: deviceTable.encryptedSymmKey,
                userId: deviceTable.userId,
            })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (resultDevice.length === 0) {
            // device has never been registered
            return { isSyncing: false };
        } else {
            return {
                isSyncing: resultDevice[0].encryptedSymmKey !== null,
                userId: resultDevice[0].userId,
            };
        }
    }

    static async updateCodeGuessAttemptAmount(
        db: PostgresDatabase,
        didWrite: string,
        attemptAmount: number
    ) {
        return await db
            .update(authAttemptTable)
            .set({
                guessAttemptAmount: attemptAmount,
                updatedAt: new Date(),
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
    }

    static async isEmailAssociatedWithDevice(
        db: PostgresDatabase,
        email: string,
        didWrite: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(userTable)
            .leftJoin(emailTable, eq(emailTable.userId, userTable.id))
            .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(
                and(
                    eq(emailTable.email, email),
                    eq(deviceTable.didWrite, didWrite)
                )
            );
        if (result.length !== 0) {
            return true;
        } else {
            return false;
        }
    }

    static async verifyOtp(
        db: PostgresDatabase,
        maxAttempt: number,
        didWrite: string,
        code: number,
        encryptedSymmKey: string,
        httpErrors: HttpErrors
    ): Promise<VerifyOtp200> {
        // TODO: make cron job to clean up devices awaiting syncing for too long
        await this.throwIfAwaitingSyncingOrLoggedIn(db, didWrite, httpErrors);
        const resultOtp = await db
            .select({
                userId: authAttemptTable.userId,
                email: authAttemptTable.email,
                authType: authAttemptTable.type,
                guessAttemptAmount: authAttemptTable.guessAttemptAmount,
                code: authAttemptTable.code,
                codeExpiry: authAttemptTable.codeExpiry,
            })
            .from(authAttemptTable)
            .where(eq(authAttemptTable.didWrite, didWrite));
        if (resultOtp.length === 0) {
            throw httpErrors.badRequest(
                "Device has never made an authentication attempt"
            );
        }
        const now = new Date();
        if (resultOtp[0].codeExpiry <= now) {
            return { success: false, reason: "expired_code" };
        } else if (resultOtp[0].code === code) {
            switch (resultOtp[0].authType) {
                case "register": {
                    await Service.register(db, didWrite, encryptedSymmKey);
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        encryptedSymmKey: encryptedSymmKey,
                        syncingDevices: [didWrite],
                        emailCredentialsPerEmail: {},
                        secretCredentialsPerType: {},
                    };
                }
                case "login_known_device": {
                    // device is not awaiting syncing and is not already logged-in, otherwise throwIfAwaitingSyncingOrLoggedIn would have thrown already
                    const existingEncryptedSymmKey =
                        await Service.getEncryptedSymmKey(db, didWrite);
                    if (existingEncryptedSymmKey !== undefined) {
                        // this check is unecessary because device is not awaiting syncing, but we keep it as a safety net in case someone accidentally removes the throws protection
                        await Service.login(db, didWrite);
                    }
                    const syncingDevices = await Service.getAllSyncingDidWrites(
                        db,
                        resultOtp[0].userId
                    );
                    const emailCredentialsPerEmail =
                        await Service.getEmailCredentialsPerEmailFromUserId(
                            db,
                            resultOtp[0].userId
                        );
                    const secretCredentialsPerType =
                        await Service.getSecretCredentialsPerType(
                            db,
                            resultOtp[0].userId
                        );
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        encryptedSymmKey: existingEncryptedSymmKey,
                        syncingDevices: syncingDevices,
                        emailCredentialsPerEmail: emailCredentialsPerEmail,
                        secretCredentialsPerType: secretCredentialsPerType,
                    };
                }
                case "login_new_device": {
                    await Service.awaitSyncingNewDevice(db, didWrite);
                    const syncingDevices = await Service.getAllSyncingDidWrites(
                        db,
                        resultOtp[0].userId
                    );
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        syncingDevices: syncingDevices,
                        emailCredentialsPerEmail: {}, // user may actually have already filled credentials, but this will be unused. We don't want to send the credentials before the device has been confirmed
                        secretCredentialsPerType: {}, // TODO: remove them altogether when z.switch will be shipped instead of z.discriminatedUnion (cannot embed z.discriminatedUnion...)
                    };
                }
            }
        } else {
            await Service.updateCodeGuessAttemptAmount(
                db,
                didWrite,
                resultOtp[0].guessAttemptAmount + 1
            );
            if (resultOtp[0].guessAttemptAmount + 1 >= maxAttempt) {
                // code is now considered expired
                await Service.expireCode(db, didWrite);
                return {
                    success: false,
                    reason: "too_many_wrong_guess",
                };
            }
            return {
                success: false,
                reason: "wrong_guess",
            };
        }
    }

    static async expireCode(db: PostgresDatabase, didWrite: string) {
        const now = new Date();
        await db
            .update(authAttemptTable)
            .set({
                codeExpiry: now,
                updatedAt: now,
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
    }

    static async getAllSyncingDidWrites(
        db: PostgresDatabase,
        userId: string
    ): Promise<Devices> {
        const results = await db
            .select({ didWrite: deviceTable.didWrite })
            .from(deviceTable)
            .where(
                and(
                    eq(deviceTable.userId, userId),
                    isNotNull(deviceTable.encryptedSymmKey)
                )
            );
        if (results.length === 0) {
            return [];
        } else {
            return results.map((result) => result.didWrite);
        }
    }

    static async hasFilledForms(
        db: PostgresDatabase,
        email: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(credentialEmailTable)
            .where(
                and(
                    eq(credentialEmailTable.email, email),
                    eq(credentialEmailTable.isRevoked, false)
                )
            );
        if (result.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    static async isEmailAvailable(
        db: PostgresDatabase,
        email: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(emailTable)
            .where(eq(emailTable.email, email));
        if (result.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    static async isDidWriteAvailable(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (result.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    static async isDidExchangeAvailable(
        db: PostgresDatabase,
        didExchange: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(deviceTable)
            .where(eq(deviceTable.didExchange, didExchange));
        if (result.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    static async authenticateAttempt(
        db: PostgresDatabase,
        type: AuthenticateType,
        authenticateRequestBody: AuthenticateRequestBody,
        userId: string,
        minutesBeforeCodeExpiry: number,
        didWrite: string,
        throttleMinutesInterval: number,
        httpErrors: HttpErrors
    ): Promise<AuthenticateOtp> {
        const now = new Date();
        const resultHasAttempted = await db
            .select({
                codeExpiry: authAttemptTable.codeExpiry,
                lastEmailSentAt: authAttemptTable.lastEmailSentAt,
            })
            .from(authAttemptTable)
            .where(eq(authAttemptTable.didWrite, didWrite));
        if (resultHasAttempted.length === 0) {
            // this is a first attempt, generate new code, insert data and send email in one transaction
            return await this.insertAuthAttemptCode(
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors
            );
        } else if (authenticateRequestBody.isRequestingNewCode) {
            // if user wants to regenerate new code, do it (if possible according to throttling rules)
            return await this.updateAuthAttemptCode(
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors
            );
        } else if (resultHasAttempted[0].codeExpiry > now) {
            // code hasn't expired
            const nextCodeSoonestTime = resultHasAttempted[0].lastEmailSentAt;
            nextCodeSoonestTime.setMinutes(
                nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
            );
            return {
                codeExpiry: resultHasAttempted[0].codeExpiry,
                nextCodeSoonestTime: nextCodeSoonestTime,
            };
        } else {
            // code has expired, generate a new one if not throttled
            return await this.updateAuthAttemptCode(
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors
            );
        }
    }

    static async insertAuthAttemptCode(
        db: PostgresDatabase,
        type: AuthenticateType,
        userId: string,
        minutesBeforeCodeExpiry: number,
        didWrite: string,
        now: Date,
        authenticateRequestBody: AuthenticateRequestBody,
        throttleMinutesInterval: number,
        httpErrors: HttpErrors
    ): Promise<AuthenticateOtp> {
        await Service.throttleByEmail(
            db,
            authenticateRequestBody.email,
            throttleMinutesInterval,
            httpErrors
        );
        const oneTimeCode = generateOneTimeCode();
        const codeExpiry = new Date();
        codeExpiry.setMinutes(
            codeExpiry.getMinutes() + minutesBeforeCodeExpiry
        );
        // TODO: transaction to actually send the email + update DB && remove the logging below!
        // TODO: verify if email does exist and is reachable to avoid bounce. Use: https://github.com/reacherhq/check-if-email-exists
        console.log("\n\nCode:", codeToString(oneTimeCode), codeExpiry, "\n\n");
        await db.insert(authAttemptTable).values({
            didWrite: didWrite,
            type: type,
            email: authenticateRequestBody.email,
            userId: userId,
            didExchange: authenticateRequestBody.didExchange,
            code: oneTimeCode,
            codeExpiry: codeExpiry,
            lastEmailSentAt: now,
        });
        const nextCodeSoonestTime = new Date();
        nextCodeSoonestTime.setTime(now.getTime());
        nextCodeSoonestTime.setMinutes(
            nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
        );
        return {
            codeExpiry: codeExpiry,
            nextCodeSoonestTime: nextCodeSoonestTime,
        };
    }

    static async updateAuthAttemptCode(
        db: PostgresDatabase,
        type: AuthenticateType,
        userId: string,
        minutesBeforeCodeExpiry: number,
        didWrite: string,
        now: Date,
        authenticateRequestBody: AuthenticateRequestBody,
        throttleMinutesInterval: number,
        httpErrors: HttpErrors
    ): Promise<AuthenticateOtp> {
        await Service.throttleByEmail(
            db,
            authenticateRequestBody.email,
            throttleMinutesInterval,
            httpErrors
        );
        const oneTimeCode = generateOneTimeCode();
        const codeExpiry = new Date();
        codeExpiry.setMinutes(
            codeExpiry.getMinutes() + minutesBeforeCodeExpiry
        );
        // TODO: transaction to actually send the email + update DB && remove the logging below!
        // TODO: verify if email does exist and is reachable to avoid bounce. Use: https://github.com/reacherhq/check-if-email-exists
        console.log("\n\nCode:", codeToString(oneTimeCode), codeExpiry, "\n\n");
        await db
            .update(authAttemptTable)
            .set({
                userId: userId,
                email: authenticateRequestBody.email,
                didExchange: authenticateRequestBody.didExchange,
                type: type,
                code: oneTimeCode,
                codeExpiry: codeExpiry,
                guessAttemptAmount: 0,
                lastEmailSentAt: now,
                updatedAt: now,
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
        const nextCodeSoonestTime = new Date();
        nextCodeSoonestTime.setTime(now.getTime());
        nextCodeSoonestTime.setMinutes(
            nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
        );
        return {
            codeExpiry: codeExpiry,
            nextCodeSoonestTime: nextCodeSoonestTime,
        };
    }

    // ! WARN we assume the OTP was verified for registering at this point
    static async register(
        db: PostgresDatabase,
        didWrite: string,
        encryptedSymmKey: string
    ): Promise<void> {
        const uid = generateRandomHex();
        const now = new Date();
        const in1000years = new Date();
        in1000years.setFullYear(in1000years.getFullYear() + 1000);
        return await db.transaction(async (tx) => {
            const authAttemptResult = await tx
                .select({
                    email: authAttemptTable.email,
                    userId: authAttemptTable.userId,
                    didExchange: authAttemptTable.didExchange,
                })
                .from(authAttemptTable)
                .where(eq(authAttemptTable.didWrite, didWrite));
            if (authAttemptResult.length === 0) {
                throw new Error(
                    "No register attempt was initiated - cannot register the user"
                );
            }
            await tx
                .update(authAttemptTable)
                .set({
                    codeExpiry: now, // this is important to forbid further usage of the same code once it has been successfully guessed
                    updatedAt: now,
                })
                .where(eq(authAttemptTable.didWrite, didWrite));
            await tx
                .insert(userTable)
                .values({ uid: uid, id: authAttemptResult[0].userId });
            await tx.insert(deviceTable).values({
                userId: authAttemptResult[0].userId,
                didWrite: didWrite,
                didExchange: authAttemptResult[0].didExchange,
                encryptedSymmKey: encryptedSymmKey,
                sessionExpiry: in1000years,
            });
            await tx.insert(emailTable).values({
                userId: authAttemptResult[0].userId,
                type: "primary",
                email: authAttemptResult[0].email,
            });
            // const credential = buildEmailCredential(email, sk);
            // const credentialStr = JSON.stringify(credential.toJSON());
            // await tx.insert(credentialEmailTable).values({
            //     email: email,
            //     credential: credentialStr,
            //     isRevoked: false,
            // });
            // const emailCredentials: { [email: string]: EmailCredentials } = {
            //     [email]: {
            //         active: credentialStr,
            //         revoked: [],
            //     },
            // };
            // return emailCredentials;
        });
    }

    // ! WARN we assume the OTP was verified for login new device at this point
    static async awaitSyncingNewDevice(db: PostgresDatabase, didWrite: string) {
        const now = new Date();
        await db.transaction(async (tx) => {
            const authAttemptResult = await tx
                .select({
                    userId: authAttemptTable.userId,
                    didExchange: authAttemptTable.didExchange,
                })
                .from(authAttemptTable)
                .where(eq(authAttemptTable.didWrite, didWrite));
            if (authAttemptResult.length === 0) {
                throw new Error(
                    "No loginNewDevice attempt was initiated - cannot login the user"
                );
            }
            await tx
                .update(authAttemptTable)
                .set({
                    codeExpiry: now, // this is important to forbid further usage of the same code once it has been successfully guessed
                    updatedAt: now,
                })
                .where(eq(authAttemptTable.didWrite, didWrite));
            await tx.insert(deviceTable).values({
                userId: authAttemptResult[0].userId,
                didWrite: didWrite,
                // it's a new device - so no encryption key. Users must manually accept syncing from an existing syncing device. This is necessary because symmetric keys are only known client-side, and it is a protection against an attacker that would have access to the user's email address. Even in such situation, the attacker will not be able to get access to the user's credentials and secrets unless the attacker has also access to one of the user's existing syncing device - or unless the attacker successfully phishes the user into accepting syncing with the attacker's device.
                didExchange: authAttemptResult[0].didExchange,
                sessionExpiry: now,
            });
        });
    }

    // ! WARN we assume the OTP was verified and the device is already syncing
    static async login(db: PostgresDatabase, didWrite: string) {
        const now = new Date();
        const in1000years = new Date();
        in1000years.setFullYear(in1000years.getFullYear() + 1000);
        await db.transaction(async (tx) => {
            await tx
                .update(authAttemptTable)
                .set({
                    codeExpiry: now, // this is important to forbid further usage of the same code once it has been successfully guessed
                    updatedAt: now,
                })
                .where(eq(authAttemptTable.didWrite, didWrite));
            await tx
                .update(deviceTable)
                .set({
                    sessionExpiry: in1000years,
                    updatedAt: now,
                })
                .where(eq(deviceTable.didWrite, didWrite));
        });
    }

    // minutesInterval: "3" in "we allow one email every 3 minutes"
    static async throttleByEmail(
        db: PostgresDatabase,
        email: string,
        minutesInterval: number,
        httpErrors: HttpErrors
    ) {
        // now - 3 minutes if minutesInterval == 3
        const minutesIntervalAgo = new Date();
        minutesIntervalAgo.setMinutes(
            minutesIntervalAgo.getMinutes() - minutesInterval
        );

        const result = await db
            .select({ lastEmailSentAt: authAttemptTable.lastEmailSentAt })
            .from(authAttemptTable)
            .where(
                and(
                    eq(authAttemptTable.email, email),
                    gt(authAttemptTable.lastEmailSentAt, minutesIntervalAgo) // we select emails sent between 3 minutes ago and now
                )
            );
        if (result.length !== 0) {
            throw httpErrors.tooManyRequests(
                "Throttling amount of emails sent"
            );
        }
    }

    // ! WARNING check should already been done that the device exists and is logged in
    static async logout(db: PostgresDatabase, didWrite: string) {
        const now = new Date();
        return await db
            .update(deviceTable)
            .set({
                sessionExpiry: now,
                updatedAt: now,
            })
            .where(eq(deviceTable.didWrite, didWrite));
    }

    static async getEmailsFromDidWrite(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string[]> {
        const results = await db
            .select({ email: emailTable.email })
            .from(emailTable)
            .leftJoin(userTable, eq(userTable.id, emailTable.userId))
            .leftJoin(deviceTable, eq(deviceTable.userId, emailTable.userId))
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            return [];
        } else {
            return results.map((result) => result.email);
        }
    }

    static async getEmailsFromUserId(
        db: PostgresDatabase,
        userId: string
    ): Promise<string[]> {
        const results = await db
            .select({ email: emailTable.email })
            .from(emailTable)
            .leftJoin(userTable, eq(emailTable.userId, userTable.id))
            .where(eq(userTable.id, userId));
        if (results.length === 0) {
            return [];
        } else {
            return results.map((result) => result.email);
        }
    }

    static async getEmailCredentialsPerEmailFromDidWrite(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<EmailCredentialsPerEmail> {
        const emails = await Service.getEmailsFromDidWrite(db, didWrite);
        return await Service.getEmailCredentialsPerEmail(db, emails);
    }

    static async getEmailCredentialsPerEmailFromUserId(
        db: PostgresDatabase,
        userId: string
    ): Promise<EmailCredentialsPerEmail> {
        const emails = await Service.getEmailsFromUserId(db, userId);
        return await Service.getEmailCredentialsPerEmail(db, emails);
    }

    static async getEmailCredentialsPerEmail(
        db: PostgresDatabase,
        emails: string[]
    ): Promise<EmailCredentialsPerEmail> {
        const results = await db
            .select({
                email: credentialEmailTable.email,
                emailCredential: credentialEmailTable.credential,
                isRevoked: credentialEmailTable.isRevoked,
            })
            .from(credentialEmailTable)
            .where(inArray(credentialEmailTable.email, emails));
        if (results.length === 0) {
            return {};
        } else {
            const emailCredentials: EmailCredentialsPerEmail = {};
            for (const result of results) {
                if (result.email in emailCredentials) {
                    if (result.isRevoked) {
                        emailCredentials[result.email].revoked.push(
                            result.emailCredential as string
                        ); // TODO make sure this is string and not object...
                    } else {
                        emailCredentials[result.email].active =
                            result.emailCredential as string; // TODO make sure this is string and not object...
                    }
                } else {
                    if (result.isRevoked) {
                        emailCredentials[result.email] = {
                            revoked: [result.emailCredential as string],
                        };
                    } else {
                        emailCredentials[result.email] = {
                            active: result.emailCredential as string, // TODO make sure this is string and not object...
                            revoked: [],
                        };
                    }
                }
            }
            return emailCredentials;
        }
    }

    static async createAndStoreEmailCredential(
        db: PostgresDatabase,
        email: string,
        sk: SecretKey
    ): Promise<string> {
        const credential = buildEmailCredential(email, sk);
        const credentialStr = JSON.stringify(credential.toJSON());
        await db.insert(credentialEmailTable).values({
            email: email,
            credential: credentialStr,
        });
        return credentialStr;
    }

    static async getUserIdFromDevice(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string> {
        const results = await db
            .select({ userId: userTable.id })
            .from(userTable)
            .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            throw new Error("This didWrite is not registered to any user");
        }
        return results[0].userId;
    }

    static async getSecretCredentialsPerType(
        db: PostgresDatabase,
        userId: string
    ): Promise<SecretCredentialsPerType> {
        const results = await db
            .select({
                pollId: credentialSecretTable.pollId,
                secretCredential: credentialSecretTable.credential, // TODO: make sure this really output a string...
                isRevoked: credentialSecretTable.isRevoked,
            })
            .from(credentialSecretTable)
            .where(eq(credentialSecretTable.userId, userId));
        if (results.length === 0) {
            return {};
        } else {
            const secretCredentialsPerType: SecretCredentialsPerType = {};
            for (const result of results) {
                if (
                    result.pollId !== null &&
                    result.pollId in secretCredentialsPerType
                ) {
                    if (result.isRevoked) {
                        secretCredentialsPerType[result.pollId].revoked.push(
                            result.secretCredential as string
                        ); // TODO make sure this is string and not object...
                    } else {
                        secretCredentialsPerType[result.pollId].active =
                            result.secretCredential as string; // TODO make sure this is string and not object...
                    }
                } else if (result.pollId !== null) {
                    if (result.isRevoked) {
                        secretCredentialsPerType[result.pollId] = {
                            revoked: [result.secretCredential as string],
                        };
                    } else {
                        secretCredentialsPerType[result.pollId] = {
                            active: result.secretCredential as string, // TODO make sure this is string and not object...
                            revoked: [],
                        };
                    }
                } else if ("global" in secretCredentialsPerType) {
                    if (result.isRevoked) {
                        secretCredentialsPerType["global"].revoked.push(
                            result.secretCredential as string
                        ); // TODO make sure this is string and not object...
                    } else {
                        secretCredentialsPerType["global"].active =
                            result.secretCredential as string; // TODO make sure this is string and not object...
                    }
                } else {
                    secretCredentialsPerType["global"] = {
                        active: result.secretCredential as string, // TODO make sure this is string and not object...
                        revoked: [],
                    };
                }
            }
            return secretCredentialsPerType;
        }
    }

    static async getEncryptedSymmKey(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string | undefined> {
        const results = await db
            .select({ encryptedSymmKey: deviceTable.encryptedSymmKey })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            return undefined;
        }
        if (results[0].encryptedSymmKey === null) {
            return undefined;
        }
        return results[0].encryptedSymmKey;
    }

    // maybe remove that when ServerSideEvents is implemented...
    static async getCredentials(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<UserCredentials> {
        const emailCredentialsPerEmail =
            await Service.getEmailCredentialsPerEmailFromDidWrite(db, didWrite);
        const userId = await Service.getUserIdFromDevice(db, didWrite);
        const secretCredentialsPerType =
            await Service.getSecretCredentialsPerType(db, userId);
        return {
            emailCredentialsPerEmail: emailCredentialsPerEmail,
            secretCredentialsPerType: secretCredentialsPerType,
        };
    }
}
