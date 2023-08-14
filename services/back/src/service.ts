import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, gt } from "drizzle-orm";
import {
  authAttemptTable,
  deviceTable,
  emailTable,
  userTable,
} from "./schema.js";
import {
  type AuthenticateRequestBody,
  type ValidateOtpResponse,
} from "./dto.js";
import {
  generateOneTimeCode,
  generateRandomHex,
  generateUUID,
} from "./crypto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";

export interface RegisterOtp {
  codeExpiry: Date;
}

export enum AuthenticateType {
  REGISTER,
  LOGIN_KNOWN_DEVICE,
  LOGIN_NEW_DEVICE,
}

// No need to validate data, it has been done in the controller level
export class Service {
  static async getAuthenticateType(
    db: PostgresJsDatabase,
    authenticateBody: AuthenticateRequestBody,
    didWrite: string,
    httpErrors: HttpErrors
  ): Promise<AuthenticateType> {
    const isEmailAvailable = await Service.isEmailAvailable(
      db,
      authenticateBody.email
    );
    const isDidWriteAvailable = await Service.isDidWriteAvailable(db, didWrite);
    const isDidExchangeAvailable = await Service.isDidExchangeAvailable(
      db,
      authenticateBody.didExchange
    );
    if (isDidWriteAvailable !== isDidExchangeAvailable) {
      httpErrors.forbidden(
        `[MITM] Either didWrite or didExchange is unavailable: isEmailAvailable=${isEmailAvailable}, isDidWriteAvailable=${isDidWriteAvailable}, isDidExchangeAvailable=${isDidExchangeAvailable}`
      );
      // we can now safely ignore isDidExchangeAvailable in our AND clauses because it is equal to isDidWriteAvailable
    }
    if (isEmailAvailable && isDidWriteAvailable) {
      return AuthenticateType.REGISTER;
    } else if (!isEmailAvailable && isDidWriteAvailable) {
      // login from a new device
      const isEmailAssociatedWithRightUser =
        Service.isEmailAssociatedWithRightUser(
          db,
          authenticateBody.email,
          authenticateBody.userId
        );
      if (!isEmailAssociatedWithRightUser) {
        throw httpErrors.forbidden("Email is not associated with this user");
      }
      return AuthenticateType.LOGIN_NEW_DEVICE;
    } else if (!isEmailAvailable && !isDidWriteAvailable) {
      // login from a known device
      const areDidEmailAssociatedWithRightUser =
        Service.areDidEmailAssociatedWithRightUser(
          db,
          authenticateBody,
          didWrite
        );
      if (!areDidEmailAssociatedWithRightUser) {
        throw httpErrors.forbidden(
          "Email and/or DIDs are not associated with this user"
        );
      }
      return AuthenticateType.LOGIN_KNOWN_DEVICE;
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
      // The email is not associated with any user
      return generateUUID();
    } else {
      return result[0].userId;
    }
  }

  static async isLoggedIn(db: PostgresJsDatabase, didWrite: string) {
    const resultDevice = await db
      .select()
      .from(deviceTable)
      .where(
        and(
          eq(deviceTable.didWrite, didWrite),
          gt(deviceTable.sessionExpiry, new Date())
        )
      );
    if (resultDevice.length === 0) {
      // device has never been registered OR device is logged-out
      return false;
    } else {
      return true;
    }
  }

  static async validateOtp(
    db: PostgresJsDatabase,
    didWrite: string,
    code: number,
    httpErrors: HttpErrors
  ): Promise<ValidateOtpResponse> {
    // if user is already logged-in, it means either the auth attempt wasn't initiated OR the code was already validated
    const isLoggedIn = await Service.isLoggedIn(db, didWrite);
    if (isLoggedIn) {
      throw httpErrors.conflict("Device is already logged-in");
    }
    const resultOtp = await db
      .select({
        authType: authAttemptTable.type,
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
    } else if (resultOtp[0].codeExpiry.getTime() <= now.getTime()) {
      return {
        success: false,
        reason: "expired_code",
      };
    } else if (resultOtp[0].code !== code) {
      return {
        success: false,
        reason: "wrong_guess",
      };
    } else {
      switch (resultOtp[0].authType) {
        case "register":
          await Service.register(db, didWrite);
          return {
            success: true,
          };
        case "login_known_device":
          // TODO
          return {
            success: true,
          };
        case "login_new_device":
          // TODO
          return {
            success: true,
          };
      }
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

  static async isEmailAssociatedWithRightUser(
    db: PostgresJsDatabase,
    email: string,
    userId: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(userTable)
      .leftJoin(emailTable, eq(emailTable.userId, userTable.id))
      .where(and(eq(emailTable.email, email), eq(userTable.id, userId)));
    if (result.length !== 0) {
      return true;
    } else {
      return false;
    }
  }

  static async areDidEmailAssociatedWithRightUser(
    db: PostgresJsDatabase,
    authenticateRequestBody: AuthenticateRequestBody,
    didWrite: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(userTable)
      .leftJoin(emailTable, eq(emailTable.userId, userTable.id))
      .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
      .where(
        and(
          eq(userTable.id, authenticateRequestBody.userId),
          eq(emailTable.email, authenticateRequestBody.email),
          eq(deviceTable.didWrite, didWrite),
          eq(deviceTable.didExchange, authenticateRequestBody.didExchange)
        )
      );
    if (result.length !== 0) {
      return true;
    } else {
      return false;
    }
  }

  static async registerAttempt(
    db: PostgresJsDatabase,
    authenticateRequestBody: AuthenticateRequestBody,
    didWrite: string
  ): Promise<RegisterOtp> {
    const oneTimeCode = generateOneTimeCode();
    // Code Expiry is 1 hour - default value in Ory
    const codeExpiry = new Date();
    codeExpiry.setHours(codeExpiry.getHours() + 1);
    // TODO: transaction to actually send the email + update DB && remove the logging below!
    console.log("Code:", oneTimeCode, codeExpiry);
    await db.insert(authAttemptTable).values({
      didWrite: didWrite,
      type: "register",
      email: authenticateRequestBody.email,
      userId: authenticateRequestBody.userId,
      didExchange: authenticateRequestBody.didExchange,
      code: oneTimeCode,
      codeExpiry: codeExpiry,
    });
    return { codeExpiry: codeExpiry };
  }

  // ! WARN we assume the OTP was validated at this point
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
        .where(
          and(
            eq(authAttemptTable.didWrite, didWrite),
            eq(authAttemptTable.type, "register")
          )
        );
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
}
