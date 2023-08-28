import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, gt } from "drizzle-orm";
import {
  authAttemptTable,
  deviceTable,
  emailTable,
  userTable,
} from "../schema.js";
import { type IsLoggedInResponse, type VerifyOtpResponse } from "../dto.js";
import {
  codeToString,
  generateOneTimeCode,
  generateRandomHex,
  generateUUID,
} from "../crypto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import type { AuthenticateRequestBody } from "../index.js";

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
export class AuthService {
  static async getAuthenticateType(
    db: PostgresJsDatabase,
    authenticateBody: AuthenticateRequestBody,
    didWrite: string,
    httpErrors: HttpErrors
  ): Promise<AuthTypeAndUserId> {
    const isEmailAvailable = await AuthService.isEmailAvailable(
      db,
      authenticateBody.email
    );
    const isDidWriteAvailable = await AuthService.isDidWriteAvailable(
      db,
      didWrite
    );
    const isDidExchangeAvailable = await AuthService.isDidExchangeAvailable(
      db,
      authenticateBody.didExchange
    );
    if (isDidWriteAvailable !== isDidExchangeAvailable) {
      throw httpErrors.forbidden(
        `[MITM] Either didWrite or didExchange is unavailable: isEmailAvailable=${isEmailAvailable}, isDidWriteAvailable=${isDidWriteAvailable}, isDidExchangeAvailable=${isDidExchangeAvailable}`
      );
      // we can now safely ignore isDidExchangeAvailable in our AND clauses because it is equal to isDidWriteAvailable
    }

    const userId = await AuthService.getUserId(db, authenticateBody.email);
    if (isEmailAvailable && isDidWriteAvailable) {
      return { type: AuthenticateType.REGISTER, userId: userId };
    } else if (!isEmailAvailable && isDidWriteAvailable) {
      return { type: AuthenticateType.LOGIN_NEW_DEVICE, userId: userId };
    } else if (!isEmailAvailable && !isDidWriteAvailable) {
      const isLoggedInResult = await AuthService.isLoggedIn(db, didWrite);
      if (isLoggedInResult.isLoggedIn) {
        // user already logged-in - send userId in message
        throw httpErrors.conflict(isLoggedInResult.userId);
      }
      return { type: AuthenticateType.LOGIN_KNOWN_DEVICE, userId: userId };
    } else {
      // if (!isEmailAvailable && isDidWriteAvailable) {
      throw httpErrors.forbidden(
        `DIDs are associated with another email address`
      );
    }
  }

  static async getUserId(
    db: PostgresJsDatabase,
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

  static async isLoggedIn(
    db: PostgresJsDatabase,
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

  static async updateCodeGuessAttemptAmount(
    db: PostgresJsDatabase,
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

  static async verifyOtp(
    db: PostgresJsDatabase,
    maxAttempt: number,
    didWrite: string,
    code: number,
    httpErrors: HttpErrors
  ): Promise<VerifyOtpResponse> {
    // if the device is already logged in, it means either the auth attempt wasn't initiated OR the code was already verified
    const isLoggedInResult = await AuthService.isLoggedIn(db, didWrite);
    if (isLoggedInResult.isLoggedIn) {
      // user already logged-in - send userId in message
      throw httpErrors.conflict(isLoggedInResult.userId);
    }
    const resultOtp = await db
      .select({
        userId: authAttemptTable.userId,
        authType: authAttemptTable.type,
        guessAttemptAmount: authAttemptTable.guessAttemptAmount,
        code: authAttemptTable.code,
        codeExpiry: authAttemptTable.codeExpiry,
      })
      .from(authAttemptTable)
      .where(eq(authAttemptTable.didWrite, didWrite));
    const now = new Date();
    if (resultOtp.length === 0) {
      throw httpErrors.badRequest(
        "Device has never made an authentication attempt"
      );
    } else if (resultOtp[0].codeExpiry <= now) {
      return {
        success: false,
        reason: "expired_code",
      };
    } else if (resultOtp[0].code === code) {
      switch (resultOtp[0].authType) {
        case "register":
          await AuthService.register(db, didWrite);
          return {
            success: true,
            userId: resultOtp[0].userId,
          };
        case "login_known_device":
          await AuthService.loginKnownDevice(db, didWrite);
          return {
            success: true,
            userId: resultOtp[0].userId,
          };
        case "login_new_device":
          await AuthService.loginNewDevice(db, didWrite);
          return {
            success: true,
            userId: resultOtp[0].userId,
          };
      }
    } else if (resultOtp[0].guessAttemptAmount + 1 >= maxAttempt) {
      // we add one to take into account the current guess attempt
      return {
        success: false,
        reason: "too_many_wrong_guess",
      };
    } else {
      await AuthService.updateCodeGuessAttemptAmount(
        db,
        didWrite,
        resultOtp[0].guessAttemptAmount + 1
      );
      return {
        success: false,
        reason: "wrong_guess",
      };
    }
  }

  static async isEmailAvailable(
    db: PostgresJsDatabase,
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
    db: PostgresJsDatabase,
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
    db: PostgresJsDatabase,
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
    db: PostgresJsDatabase,
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
    db: PostgresJsDatabase,
    type: AuthenticateType,
    userId: string,
    minutesBeforeCodeExpiry: number,
    didWrite: string,
    now: Date,
    authenticateRequestBody: AuthenticateRequestBody,
    throttleMinutesInterval: number,
    httpErrors: HttpErrors
  ): Promise<AuthenticateOtp> {
    await AuthService.throttleByEmail(
      db,
      authenticateRequestBody.email,
      throttleMinutesInterval,
      httpErrors
    );
    const oneTimeCode = generateOneTimeCode();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + minutesBeforeCodeExpiry);
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
    db: PostgresJsDatabase,
    type: AuthenticateType,
    userId: string,
    minutesBeforeCodeExpiry: number,
    didWrite: string,
    now: Date,
    authenticateRequestBody: AuthenticateRequestBody,
    throttleMinutesInterval: number,
    httpErrors: HttpErrors
  ): Promise<AuthenticateOtp> {
    await AuthService.throttleByEmail(
      db,
      authenticateRequestBody.email,
      throttleMinutesInterval,
      httpErrors
    );
    const oneTimeCode = generateOneTimeCode();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + minutesBeforeCodeExpiry);
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
  static async register(db: PostgresJsDatabase, didWrite: string) {
    const uid = generateRandomHex();
    const in1000years = new Date();
    in1000years.setFullYear(in1000years.getFullYear() + 1000);
    await db.transaction(async (tx) => {
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
        .insert(userTable)
        .values({ uid: uid, id: authAttemptResult[0].userId });
      await tx.insert(deviceTable).values({
        userId: authAttemptResult[0].userId,
        didWrite: didWrite,
        didExchange: authAttemptResult[0].didExchange,
        sessionExpiry: in1000years,
      });
      await tx.insert(emailTable).values({
        userId: authAttemptResult[0].userId,
        type: "primary",
        email: authAttemptResult[0].email,
      });
    });
  }

  // ! WARN we assume the OTP was verified for login new device at this point
  static async loginNewDevice(db: PostgresJsDatabase, didWrite: string) {
    const in1000years = new Date();
    in1000years.setFullYear(in1000years.getFullYear() + 1000);
    const authAttemptResult = await db
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
    await db.insert(deviceTable).values({
      userId: authAttemptResult[0].userId,
      didWrite: didWrite,
      didExchange: authAttemptResult[0].didExchange,
      sessionExpiry: in1000years,
    });
  }

  // ! WARN we assume the OTP was verified for login known device at this point
  static async loginKnownDevice(db: PostgresJsDatabase, didWrite: string) {
    const now = new Date();
    const in1000years = new Date();
    in1000years.setFullYear(in1000years.getFullYear() + 1000);
    const authAttemptResult = await db
      .select({
        userId: authAttemptTable.userId,
        didExchange: authAttemptTable.didExchange,
      })
      .from(authAttemptTable)
      .where(eq(authAttemptTable.didWrite, didWrite));
    if (authAttemptResult.length === 0) {
      throw new Error(
        "No loginKnownDevice attempt was initiated - cannot login the user"
      );
    }
    await db
      .update(deviceTable)
      .set({
        sessionExpiry: in1000years,
        updatedAt: now,
      })
      .where(eq(deviceTable.didWrite, didWrite));
  }

  // minutesInterval: "3" in "we allow one email every 3 minutes"
  static async throttleByEmail(
    db: PostgresJsDatabase,
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
      throw httpErrors.tooManyRequests("Throttling amount of emails sent");
    }
  }

  // ! WARNING check should already been done that the device exists and is logged in
  static async logout(db: PostgresJsDatabase, didWrite: string) {
    const now = new Date();
    return await db
      .update(deviceTable)
      .set({
        sessionExpiry: now,
        updatedAt: now,
      })
      .where(eq(deviceTable.didWrite, didWrite));
  }
}
