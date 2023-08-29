import "dotenv/config"; // this loads .env values in process.env
import type { Config } from "drizzle-kit";
import { z } from "zod";

const drizzleConfigSchema = z.object({
    CONNECTION_STRING: z.string(),
});

const config = drizzleConfigSchema.parse(process.env);

export default {
    schema: "./src/schema.ts",
    out: "./drizzle",
    driver: "pg",
    dbCredentials: {
        connectionString: config.CONNECTION_STRING,
    },
} satisfies Config;
