import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { emailTable, userTable } from "./schema.js";
import { type RegisterRequestBody } from "./dto.js";

// No need to validate data, it has been done in the controller level
export class Service {
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

  static async isUsernameAvailable(
    db: PostgresJsDatabase,
    username: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username));
    if (result.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  static async register(
    _db: PostgresJsDatabase,
    _registerRequestBody: RegisterRequestBody,
    _didUcan: string
  ): Promise<boolean> {
    return true;
  }
}
