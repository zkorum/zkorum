import { userTable } from "@/schema.js";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

interface CheckUserNameExistProps {
  db: PostgresJsDatabase;
  username: string;
}

export async function checkUserNameExist({
  db, username
}: CheckUserNameExistProps): Promise<boolean> {
  const userTableResponse = await db
    .select({
    })
    .from(userTable)
    .where(eq(userTable.username, username));
  if (userTableResponse.length === 0) {
    return false;
  } else {
    return true;
  }
}