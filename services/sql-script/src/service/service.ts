import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { credentialEmailTable, credentialSecretTable } from "../schema.js";

interface DBProps {
    db: PostgresJsDatabase;
}

export class Service {
    static async revokeAllCredentials({ db }: DBProps) {
        await db.update(credentialEmailTable).set({
            isRevoked: true,
        });
        await db.update(credentialSecretTable).set({
            isRevoked: true,
        });
    }
}
