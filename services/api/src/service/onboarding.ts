import { userTable } from "@/schema.js";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

interface CheckUserNameExistProps {
  db: PostgresJsDatabase;
  userName: string;
}

export async function checkUserNameExist({
  db, userName
}: CheckUserNameExistProps): Promise<boolean> {
  const userTableResponse = await db
    .select({
    })
    .from(userTable)
    .where(eq(userTable.userName, userName));
  if (userTableResponse.length === 0) {
    return false;
  } else {
    return true;
  }
}