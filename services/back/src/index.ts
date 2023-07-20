import fs from "fs";
import "dotenv/config"; // this loads .env values in process.env
import fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Service } from "./service.js";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { Dto } from "./dto.js";
import { DrizzleFastifyLogger } from "./logger.js";
import { z } from "zod";
import cors from "@fastify/cors";

enum Environment {
  Development = "development",
  Production = "production",
  Staging = "staging",
}

const configSchema = z.object({
  CONNECTION_STRING: z.string(),
  PORT: z.number().default(8080),
  NODE_ENV: z.nativeEnum(Environment).default(Environment.Development),
});

const config = configSchema.parse(process.env);

function envToLogger(env: Environment) {
  switch (env) {
    case Environment.Development:
      return {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
      };
    case Environment.Production:
    case Environment.Staging:
      return true;
  }
}

const server = fastify({
  logger: envToLogger(config.NODE_ENV),
});

server.register(cors, {
  // put your options here
});

// Add schema validator and serializer
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: "ZKorum",
      description: "ZKorum backend",
      version: "1.0.0",
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
  // You can also create transform with custom skiplist of endpoints that should not be included in the specification:
  //
  // transform: createJsonSchemaTransform({
  //   skipList: [ '/documentation/static/*' ]
  // })
});

// Custom error handler
server.setErrorHandler((error, _request, reply) => {
  // Check if the error has a status code of 500
  if (error.statusCode === undefined || error.statusCode >= 500) {
    // Modify the response message for status code 500
    // ... by wrapping the original error with a generic error
    // For security sake, we don't want the frontend to know the exact nature of the internal errors
    const genericError = new Error("Internal server error", { cause: error });
    reply.send(genericError);
  } else {
    // For other status codes, forward the original error
    reply.send(error);
  }
});

const client = postgres(config.CONNECTION_STRING);
const db = drizzle(client, {
  logger: new DrizzleFastifyLogger(server.log),
});

server.after(() => {
  server.withTypeProvider<ZodTypeProvider>().post("/auth/isEmailAvailable", {
    schema: { body: Dto.email, response: { 200: z.boolean() } },
    handler: async (request, _reply) => {
      return await Service.isEmailAvailable(db, request.body);
    },
  });
});

server.ready((e) => {
  if (e) {
    server.log.error(e);
    process.exit(1);
  }
  if (config.NODE_ENV === Environment.Development) {
    const swaggerYaml = server.swagger({ yaml: true });
    fs.writeFileSync("./openapi-zkorum.yml", swaggerYaml);
  }
  server.listen({ port: config.PORT }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
  });
});
