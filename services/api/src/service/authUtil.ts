// util service to get data about devices, users, emails, etc
import { deviceTable, emailTable, userTable } from "@/schema.js";
import { and, eq, gt } from "drizzle-orm";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { IsLoggedInResponse } from "@/shared/types/dto.js";
import { nowZeroMs } from "@/shared/common/util.js";
import { getPostById } from "./post.ts";

interface InfoDevice {
    userAgent: string;
    userId: string;
    sessionExpiry: Date;
}

export async function isLoggedIn(
    db: PostgresDatabase,
    didWrite: string
): Promise<IsLoggedInResponse> {
    const now = nowZeroMs();
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


export async function getEmailsFromDidWrite(
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

export async function getEmailsFromUserId(
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

export async function getInfoFromDevice(
    db: PostgresDatabase,
    didWrite: string
): Promise<InfoDevice> {
    const results = await db
        .select({
            userId: userTable.id,
            userAgent: deviceTable.userAgent,
            sessionExpiry: deviceTable.sessionExpiry,
        })
        .from(userTable)
        .innerJoin(deviceTable, eq(deviceTable.userId, userTable.id))
        .where(eq(deviceTable.didWrite, didWrite));
    if (results.length === 0) {
        throw new Error("This didWrite is not registered to any user");
    }
    return {
        userId: results[0].userId,
        userAgent: results[0].userAgent,
        sessionExpiry: results[0].sessionExpiry,
    };
}

export async function isEmailAssociatedWithDevice(
    db: PostgresDatabase,
    didWrite: string,
    email: string
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


export async function getUserIdFromDevice(
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




/**
 * Determines if a user can hide a specific post.
 * @param db - The database instance.
 * @param didWrite - The DID of the device making the request.
 * @param postId - The ID of the post to hide.
 * @returns The moderator's user ID if authorized, otherwise null.
 */
export async function canHidePost(
    db: PostgresDatabase,
    didWrite: string,
    postId: number
  ): Promise<string | null> {
    const deviceInfo = await getInfoFromDevice(db, didWrite);
  
    if (!deviceInfo) {
      return null;
    }
  
    const userId = deviceInfo.userId;
  
    // Fetch the user's role
    const userResult = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .execute();
  
    if (userResult.length === 0) {
      return null;
    }
  
    const userRole = userResult[0].role;
  
    // Check if the user is an admin or moderator
    if (userRole === 'admin' || userRole === 'moderator') {
      return userId;
    }
  
    // Check if the user is the author of the post
    const post = await getPostById(db, postId);
    if (post && post.authorId === userId) {
      return userId;
    }
  
    // User is neither admin, moderator, nor author
    return null;
  }


