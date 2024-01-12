import "dotenv/config"; // this loads .env values in process.env
import { z } from "zod";
const configSchema = z.object({
    CONNECTION_STRING: z.string(),
});

export const config = configSchema.parse(process.env);
