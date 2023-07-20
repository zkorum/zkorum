import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { emailTable } from "./schema.js";

// No need to validate data, it has been done in the controller level
export class Service {
  static async isEmailAvailable(db: PostgresJsDatabase, email: string) {
    const result = await db
      .select()
      .from(emailTable)
      .where(eq(emailTable.email, email));
    if (result.length === 0) {
      return true;
    } else {
      return true;
    }
  }
}
