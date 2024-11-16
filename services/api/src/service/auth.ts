import { codeToString, generateOneTimeCode, generateUUID } from "@/crypto.js";
import { authAttemptTable, deviceTable, emailTable, userTable } from "@/schema.js";
import { nowZeroMs } from "@/shared/common/util.js";
import type { AuthenticateRequestBody, GetDeviceStatusResp, VerifyOtp200 } from "@/shared/types/dto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { eq } from "drizzle-orm";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import sesClientModule from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";

interface VerifyOtpProps {
    db: PostgresDatabase;
    maxAttempt: number;
    didWrite: string;
    code: number;
    httpErrors: HttpErrors;
}

interface RegisterProps {
    db: PostgresDatabase;
    didWrite: string;
    now: Date;
    sessionExpiry: Date;
    userName: string;
}

interface LoginProps {
    db: PostgresDatabase;
    didWrite: string;
    now: Date;
    sessionExpiry: Date;
}

interface LoginNewDeviceProps {
    db: PostgresDatabase;
    didWrite: string;
    now: Date;
    sessionExpiry: Date;
}

interface AuthTypeAndUserId {
    userId: string;
    type: AuthenticateType;
}

interface AuthenticateAttemptProps {
    db: PostgresDatabase;
    type: AuthenticateType;
    authenticateRequestBody: AuthenticateRequestBody;
    userId: string;
    minutesBeforeCodeExpiry: number;
    didWrite: string;
    userAgent: string;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    doSendEmail: boolean;
    awsMailConf: AwsMailConf;
    testCode: number;
    doUseTestCode: boolean;
}

interface UpdateAuthAttemptCodeProps {
    db: PostgresDatabase;
    type: AuthenticateType;
    userId: string;
    minutesBeforeCodeExpiry: number;
    didWrite: string;
    now: Date;
    authenticateRequestBody: AuthenticateRequestBody;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    doSendEmail: boolean;
    awsMailConf: AwsMailConf;
    testCode: number;
    doUseTestCode: boolean;
}

export interface AwsMailConf {
    accessKeyId: string;
    secretAccessKey: string;
}

interface InsertAuthAttemptCodeProps {
    db: PostgresDatabase;
    type: AuthenticateType;
    userId: string;
    minutesBeforeCodeExpiry: number;
    didWrite: string;
    now: Date;
    userAgent: string;
    authenticateRequestBody: AuthenticateRequestBody;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    testCode: number;
    doUseTestCode: boolean;
    doSendEmail: boolean;
    awsMailConf: AwsMailConf;
}

interface SendOtpEmailProps {
    email: string;
    otp: number;
    awsMailConf: AwsMailConf;
}

interface AuthenticateOtp {
    codeExpiry: Date;
    nextCodeSoonestTime: Date;
}

export async function getDeviceStatus(
    db: PostgresDatabase,
    didWrite: string
): Promise<GetDeviceStatusResp> {
    const now = nowZeroMs();
    const resultDevice = await db
        .select({
            userId: deviceTable.userId,
            sessionExpiry: deviceTable.sessionExpiry,
        })
        .from(deviceTable)
        .where(eq(deviceTable.didWrite, didWrite));
    if (resultDevice.length === 0) {
        // device has never been registered
        return undefined;
    } else {
        return {
            userId: resultDevice[0].userId,
            isLoggedIn: resultDevice[0].sessionExpiry > now,
            sessionExpiry: resultDevice[0].sessionExpiry,
        };
    }
}


export async function throwIfAlreadyLoggedIn(
    db: PostgresDatabase,
    didWrite: string,
    httpErrors: HttpErrors
): Promise<GetDeviceStatusResp> {
    const deviceStatus = await getDeviceStatus(db, didWrite);
    if (deviceStatus !== undefined) {
        if (deviceStatus.isLoggedIn) {
            throw httpErrors.createError(409, "Conflict", {
                reason: "already_logged_in",
                userId: deviceStatus.userId,
                sessionExpiry: deviceStatus.sessionExpiry,
            });
        }
    }
    return deviceStatus;
}


export async function verifyOtp({
    db,
    maxAttempt,
    didWrite,
    code,
    httpErrors,
}: VerifyOtpProps): Promise<VerifyOtp200> {
    await throwIfAlreadyLoggedIn(db, didWrite, httpErrors);
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
    const now = nowZeroMs();
    if (resultOtp[0].codeExpiry <= now) {
        return { success: false, reason: "expired_code" };
    } else if (resultOtp[0].code === code) {
        const loginSessionExpiry = new Date(now);
        loginSessionExpiry.setFullYear(
            loginSessionExpiry.getFullYear() + 1000
        );
        switch (resultOtp[0].authType) {
        case "register": {
            await register({
                db,
                didWrite,
                now,
                sessionExpiry: loginSessionExpiry,
                userName: "TEST USER"
            });
            return {
                success: true,
                userId: resultOtp[0].userId,
                sessionExpiry: loginSessionExpiry,
            };
        }
        case "login_known_device": {
            await loginKnownDevice({
                db,
                didWrite,
                now,
                sessionExpiry: loginSessionExpiry,
            });
            return {
                success: true,
                userId: resultOtp[0].userId,
                sessionExpiry: loginSessionExpiry,
            };
        }
        case "login_new_device": {
            await loginNewDevice({
                db,
                didWrite,
                now,
                sessionExpiry: loginSessionExpiry,
            });
            return {
                success: true,
                userId: resultOtp[0].userId,
                sessionExpiry: loginSessionExpiry,
            };
        }
        }
    } else {
        await updateCodeGuessAttemptAmount(
            db,
            didWrite,
            resultOtp[0].guessAttemptAmount + 1
        );
        if (resultOtp[0].guessAttemptAmount + 1 >= maxAttempt) {
            // code is now considered expired
            await expireCode(db, didWrite);
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


export async function expireCode(db: PostgresDatabase, didWrite: string) {
    const now = nowZeroMs();
    await db
        .update(authAttemptTable)
        .set({
            codeExpiry: now,
            updatedAt: now,
        })
        .where(eq(authAttemptTable.didWrite, didWrite));
}

export async function updateCodeGuessAttemptAmount(
    db: PostgresDatabase,
    didWrite: string,
    attemptAmount: number
) {
    const now = nowZeroMs();
    return await db
        .update(authAttemptTable)
        .set({
            guessAttemptAmount: attemptAmount,
            updatedAt: now,
        })
        .where(eq(authAttemptTable.didWrite, didWrite));
}

// ! WARN we assume the OTP was verified for registering at this point
export async function register({
    db,
    didWrite,
    now,
    sessionExpiry,
    userName
}: RegisterProps): Promise<void> {
    await db.transaction(async (tx) => {
        const authAttemptResult = await tx
            .select({
                email: authAttemptTable.email,
                userId: authAttemptTable.userId,
                userAgent: authAttemptTable.userAgent,
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
        await tx.insert(userTable).values({
            id: authAttemptResult[0].userId,
            userName: userName
        });
        await tx.insert(deviceTable).values({
            userId: authAttemptResult[0].userId,
            didWrite: didWrite,
            userAgent: authAttemptResult[0].userAgent,
            sessionExpiry: sessionExpiry,
        });
        await tx.insert(emailTable).values({
            userId: authAttemptResult[0].userId,
            type: "primary",
            email: authAttemptResult[0].email,
        });
    });
}

// ! WARN we assume the OTP was verified for login new device at this point
export async function loginNewDevice({
    db,
    didWrite,
    now,
    sessionExpiry,
}: LoginNewDeviceProps) {
    await db.transaction(async (tx) => {
        const authAttemptResult = await tx
            .select({
                userId: authAttemptTable.userId,
                userAgent: authAttemptTable.userAgent,
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
            userAgent: authAttemptResult[0].userAgent,
            sessionExpiry: sessionExpiry,
        });
    });
}

// ! WARN we assume the OTP was verified and the device is already syncing
export async function loginKnownDevice({ db, didWrite, now, sessionExpiry }: LoginProps) {
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
                sessionExpiry: sessionExpiry,
                updatedAt: now,
            })
            .where(eq(deviceTable.didWrite, didWrite));
    });
}

// should be up to date with DB value
// TODO: automatically sync them - use one type only
export enum AuthenticateType {
    REGISTER = "register",
    LOGIN_KNOWN_DEVICE = "login_known_device",
    LOGIN_NEW_DEVICE = "login_new_device",
}

export async function isEmailAvailable(
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

export async function isDidWriteAvailable(
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

export async function getOrGenerateUserId(
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

export async function getAuthenticateType(
    db: PostgresDatabase,
    authenticateBody: AuthenticateRequestBody,
    didWrite: string,
    httpErrors: HttpErrors
): Promise<AuthTypeAndUserId> {
    const isEmailAvailableVal = await isEmailAvailable(
        db,
        authenticateBody.email
    );
    const isDidWriteAvailableVal = await isDidWriteAvailable(
        db,
        didWrite
    );
    const userId = await getOrGenerateUserId(
        db,
        authenticateBody.email
    );
    if (isEmailAvailableVal && isDidWriteAvailableVal) {
        return { type: AuthenticateType.REGISTER, userId: userId };
    } else if (!isEmailAvailableVal && isDidWriteAvailableVal) {
        return { type: AuthenticateType.LOGIN_NEW_DEVICE, userId: userId };
    } else if (!isEmailAvailableVal && !isDidWriteAvailableVal) {
        await throwIfAlreadyLoggedIn(
            db,
            didWrite,
            httpErrors
        );
        return {
            type: AuthenticateType.LOGIN_KNOWN_DEVICE,
            userId: userId,
        };
    } else {
        // if (isEmailAvailable && !isDidWriteAvailable)
        throw httpErrors.forbidden(
            `The DID is associated with another email address`
        );
    }
}

export async function authenticateAttempt({
    db,
    type,
    authenticateRequestBody,
    userId,
    minutesBeforeCodeExpiry,
    didWrite,
    userAgent,
    throttleMinutesInterval,
    httpErrors,
    testCode,
    doUseTestCode,
    doSendEmail,
    awsMailConf,
}: AuthenticateAttemptProps): Promise<AuthenticateOtp> {
    const now = nowZeroMs();
    const resultHasAttempted = await db
        .select({
            codeExpiry: authAttemptTable.codeExpiry,
            lastEmailSentAt: authAttemptTable.lastEmailSentAt,
        })
        .from(authAttemptTable)
        .where(eq(authAttemptTable.didWrite, didWrite));
    if (resultHasAttempted.length === 0) {
        // this is a first attempt, generate new code, insert data and send email in one transaction
        return await insertAuthAttemptCode({
            db,
            type,
            userId,
            minutesBeforeCodeExpiry,
            didWrite,
            now,
            userAgent,
            authenticateRequestBody,
            throttleMinutesInterval,
            httpErrors,
            doSendEmail,
            awsMailConf,
            doUseTestCode,
            testCode,
        });
    } else if (authenticateRequestBody.isRequestingNewCode) {
        // if user wants to regenerate new code, do it (if possible according to throttling rules)
        return await updateAuthAttemptCode({
            db,
            type,
            userId,
            minutesBeforeCodeExpiry,
            didWrite,
            now,
            authenticateRequestBody,
            throttleMinutesInterval,
            httpErrors,
            doSendEmail,
            awsMailConf,
            doUseTestCode,
            testCode,
        });
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
        return await updateAuthAttemptCode({
            db,
            type,
            userId,
            minutesBeforeCodeExpiry,
            didWrite,
            now,
            authenticateRequestBody,
            throttleMinutesInterval,
            httpErrors,
            doSendEmail,
            awsMailConf,
            doUseTestCode,
            testCode,
        });
    }
}

export async function sendOtpEmail({ email, otp, awsMailConf }: SendOtpEmailProps) {
    // TODO: verify if email does exist and is reachable to avoid bounce. Use: https://github.com/reacherhq/check-if-email-exists

    const ses = new sesClientModule.SESClient({
        region: "eu-north-1",
        credentials: {
            accessKeyId: awsMailConf.accessKeyId,
            secretAccessKey: awsMailConf.secretAccessKey,
        },
    });
    const transporter = nodemailer.createTransport({
        SES: { ses, aws: sesClientModule },
    });

    return new Promise((resolve, reject) => {
        transporter.sendMail(
            {
                from: "noreply@notify.zkorum.com", // TODO: make this configurable
                to: email,
                subject: `ZKorum confirmation code: ${codeToString(otp)}`, // TODO make this configurable
                text: `Your confirmation code is ${codeToString(otp)}
                    \n\nEnter it shortly in the same browser/device that you used for your authentication request.\n\nIf you didn’t request this email, there’s nothing to worry about — you can safely ignore it.`, // TODO: use a beaauautiful HTML template
            },
            (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            }
        );
    });
}

export async function insertAuthAttemptCode({
    db,
    type,
    userId,
    minutesBeforeCodeExpiry,
    didWrite,
    now,
    userAgent,
    authenticateRequestBody,
    throttleMinutesInterval,
    httpErrors,
    testCode,
    doUseTestCode,
    doSendEmail,
    awsMailConf,
}: InsertAuthAttemptCodeProps): Promise<AuthenticateOtp> {
    if (doUseTestCode && doSendEmail) {
        throw httpErrors.badRequest(
            "Test code shall not be sent via email"
        );
    }
    await throttleByEmail(
        db,
        authenticateRequestBody.email,
        throttleMinutesInterval,
        minutesBeforeCodeExpiry,
        httpErrors
    );
    const oneTimeCode = doUseTestCode ? testCode : generateOneTimeCode();
    const codeExpiry = new Date(now);
    codeExpiry.setMinutes(
        codeExpiry.getMinutes() + minutesBeforeCodeExpiry
    );
    if (doSendEmail) {
        // may throw errors and return 500 :)
        await sendOtpEmail({
            email: authenticateRequestBody.email,
            otp: oneTimeCode,
            awsMailConf,
        });
    } else {
        console.log(
            "\n\nCode:",
            codeToString(oneTimeCode),
            codeExpiry,
            "\n\n"
        );
    }
    await db.insert(authAttemptTable).values({
        didWrite: didWrite,
        type: type,
        email: authenticateRequestBody.email,
        userId: userId,
        userAgent: userAgent,
        code: oneTimeCode,
        codeExpiry: codeExpiry,
        lastEmailSentAt: now,
    });
    const nextCodeSoonestTime = new Date(now);
    nextCodeSoonestTime.setMinutes(
        nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
    );
    return {
        codeExpiry: codeExpiry,
        nextCodeSoonestTime: nextCodeSoonestTime,
    };
}

export async function updateAuthAttemptCode({
    db,
    type,
    userId,
    minutesBeforeCodeExpiry,
    didWrite,
    now,
    authenticateRequestBody,
    throttleMinutesInterval,
    httpErrors,
    doSendEmail,
    awsMailConf,
    doUseTestCode,
    testCode,
}: UpdateAuthAttemptCodeProps): Promise<AuthenticateOtp> {
    if (doUseTestCode && doSendEmail) {
        throw httpErrors.badRequest(
            "Test code shall not be sent via email"
        );
    }
    await throttleByEmail(
        db,
        authenticateRequestBody.email,
        throttleMinutesInterval,
        minutesBeforeCodeExpiry,
        httpErrors
    );
    const oneTimeCode = doUseTestCode ? testCode : generateOneTimeCode();
    const codeExpiry = new Date(now);
    codeExpiry.setMinutes(
        codeExpiry.getMinutes() + minutesBeforeCodeExpiry
    );
    if (doSendEmail) {
        await sendOtpEmail({
            email: authenticateRequestBody.email,
            otp: oneTimeCode,
            awsMailConf,
        });
    } else {
        console.log(
            "\n\nCode:",
            codeToString(oneTimeCode),
            codeExpiry,
            "\n\n"
        );
    }
    await db
        .update(authAttemptTable)
        .set({
            userId: userId,
            email: authenticateRequestBody.email,
            type: type,
            code: oneTimeCode,
            codeExpiry: codeExpiry,
            guessAttemptAmount: 0,
            lastEmailSentAt: now,
            updatedAt: now,
        })
        .where(eq(authAttemptTable.didWrite, didWrite));
    const nextCodeSoonestTime = new Date(now);
    nextCodeSoonestTime.setMinutes(
        nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
    );
    return {
        codeExpiry: codeExpiry,
        nextCodeSoonestTime: nextCodeSoonestTime,
    };
}

// minutesInterval: "3" in "we allow one email every 3 minutes"
export async function throttleByEmail(
    db: PostgresDatabase,
    email: string,
    minutesInterval: number,
    minutesBeforeCodeExpiry: number,
    httpErrors: HttpErrors
) {
    const now = nowZeroMs();
    // now - 3 minutes if minutesInterval == 3
    const minutesIntervalAgo = new Date(now);
    minutesIntervalAgo.setMinutes(
        minutesIntervalAgo.getMinutes() - minutesInterval
    );

    const results = await db
        .select({
            lastEmailSentAt: authAttemptTable.lastEmailSentAt,
            codeExpiry: authAttemptTable.codeExpiry,
        })
        .from(authAttemptTable)
        .where(eq(authAttemptTable.email, email));
    for (const result of results) {
        const expectedExpiryTime = new Date(result.lastEmailSentAt);
        expectedExpiryTime.setMinutes(
            expectedExpiryTime.getMinutes() + minutesBeforeCodeExpiry
        );
        if (
            result.lastEmailSentAt.getTime() >=
            minutesIntervalAgo.getTime() &&
            expectedExpiryTime.getTime() === result.codeExpiry.getTime() // code hasn't been guessed, because otherwise it would have been manually expired before the normal expiry time
        ) {
            throw httpErrors.tooManyRequests(
                "Throttling amount of emails sent"
            );
        }
    }
}

// ! WARNING check should already been done that the device exists and is logged in
export async function logout(db: PostgresDatabase, didWrite: string) {
    const now = nowZeroMs();
    return await db
        .update(deviceTable)
        .set({
            sessionExpiry: now,
            updatedAt: now,
        })
        .where(eq(deviceTable.didWrite, didWrite));
}
