import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, lte } from "drizzle-orm";
import {
  authAttemptTable,
  deviceTable,
  emailTable,
  registerAttemptTable,
  registerOtpEmailTable,
  userTable,
} from "./schema.js";
import { type AuthenticateRequestBody } from "./dto.js";
import {
  generateOneTimeCode,
  generateRandomHex,
  generateUUID,
} from "./crypto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";

export interface RegisterOtp {
  codeId: number;
  code: string;
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

  static async validateOtp(
    db: PostgresJsDatabase,
    codeId: number,
    code: string,
    didWrite: string
  ): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const authAttemptResult = await tx
        .select({ authType: authAttemptTable.type })
        .from(authAttemptTable)
        .where(eq(authAttemptTable.didWrite, didWrite));
      if (authAttemptResult.length === 0) {
        throw new Error(
          `DID '${didWrite}' has not initiated a login/register process`
        );
      }
      switch (authAttemptResult[0].authType) {
        case "register":
          const resultOtp = await tx
            .select()
            .from(registerOtpEmailTable)
            .leftJoin(
              registerAttemptTable,
              eq(registerAttemptTable.didWrite, registerOtpEmailTable.didWrite)
            )
            .where(
              and(
                eq(registerOtpEmailTable.id, codeId),
                eq(registerOtpEmailTable.code, code),
                lte(registerOtpEmailTable.codeExpiry, new Date())
              )
            );
          if (resultOtp.length === 0) {
            return false;
          } else {
            await Service.register(db, didWrite);
            return true;
          }
        case "login_known_device":
          //TODO
          return false;
        case "login_new_device":
          //TODO
          return false;
      }
    });
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
    const codeId = await db.transaction(async (tx) => {
      await tx.insert(registerAttemptTable).values({
        email: authenticateRequestBody.email,
        userId: authenticateRequestBody.userId,
        didWrite: didWrite,
        didExchange: authenticateRequestBody.didExchange,
        isTrusted: true, // authenticateRequestBody.isTrusted,
      });
      await tx.insert(authAttemptTable).values({
        didWrite: didWrite,
        type: "register",
      });
      const result = await tx
        .insert(registerOtpEmailTable)
        .values({
          didWrite: didWrite,
          code: oneTimeCode,
          codeExpiry: codeExpiry,
        })
        .returning({ codeId: registerOtpEmailTable.id });
      return result[0].codeId;
    });
    return { codeId: codeId, code: oneTimeCode, codeExpiry: codeExpiry };
  }

  // we assume the OTP was validated at this point
  static async register(db: PostgresJsDatabase, didWrite: string) {
    const uid = generateRandomHex();
    const in1000years = new Date();
    in1000years.setFullYear(in1000years.getFullYear() + 1000);
    const in15minutes = new Date();
    in15minutes.setMinutes(in15minutes.getMinutes() + 15);
    await db.transaction(async (tx) => {
      const registerAttemptResult = await tx
        .select({
          email: registerAttemptTable.email,
          userId: registerAttemptTable.userId,
          didExchange: registerAttemptTable.didExchange,
          isTrusted: registerAttemptTable.isTrusted,
        })
        .from(registerAttemptTable)
        .where(eq(registerAttemptTable.didWrite, didWrite));
      if (registerAttemptResult.length === 0) {
        throw new Error(
          "No register attempt was initiated - cannot register the user"
        );
      }
      await tx
        .insert(userTable)
        .values({ uid: uid, id: registerAttemptResult[0].userId });
      await tx.insert(deviceTable).values({
        userId: registerAttemptResult[0].userId,
        didWrite: didWrite,
        didExchange: registerAttemptResult[0].didExchange,
        isTrusted: registerAttemptResult[0].isTrusted,
        sessionExpiry: registerAttemptResult[0].isTrusted
          ? in1000years
          : in15minutes,
      });
      await tx.insert(emailTable).values({
        userId: registerAttemptResult[0].userId,
        type: "primary",
        email: registerAttemptResult[0].email,
      });
    });
  }
}
