import { Logger } from "drizzle-orm";
import { FastifyBaseLogger as FastifyLogger } from "fastify";

export class DrizzleFastifyLogger implements Logger {
  logger: FastifyLogger;
  constructor(fastifyLogger: FastifyLogger) {
    this.logger = fastifyLogger;
  }
  logQuery(query: string, params: unknown[]): void {
    this.logger.info("%s -- %s", query, params);
  }
}
