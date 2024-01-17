import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./app.js";
import { Service } from "./service/service.js";

// const client = postgres(config.CONNECTION_STRING);
const client = postgres(config.CONNECTION_STRING);
const db = drizzle(client);

(async () => {
    try {
        await Service.updateLastReactedAt({ db });
        console.log("Database updated");
    } catch (e) {
        console.error(e);
    } finally {
        console.log("Script Finished");
    }
})();
