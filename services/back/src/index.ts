import "dotenv/config"; // this loads .env values in process.env
import fs from "fs";
import fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyAuth from "@fastify/auth";
import fastifySensible from "@fastify/sensible";
import fastifySwagger from "@fastify/swagger";
import fastifyCors from "@fastify/cors";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Service } from "./service.js";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { DrizzleFastifyLogger } from "./logger.js";
import { z } from "zod";
import { ZodType } from "./shared/types/zod.js";
import { Dto } from "./dto.js";
import * as ucans from "@ucans/ucans";
import { httpUrlToResourcePointer, rootIssuer } from "./shared/ucan/ucan.js";
import { base64 } from "./shared/common/index.js";

enum Environment {
  Development = "development",
  Production = "production",
  Staging = "staging",
}

const defaultPort = 8080;

const configSchema = z.object({
  CONNECTION_STRING: z.string(),
  PORT: z.number().default(defaultPort),
  NODE_ENV: z.nativeEnum(Environment).default(Environment.Development),
  SERVER_URL: z.string().url().default(`http://localhost:${defaultPort}`),
  SERVER_DID: ZodType.didWeb.default(`did:web:localhost%3A${defaultPort}`),
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

server.register(fastifySensible);
server.register(fastifyAuth);
server.register(fastifyCors, {
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

const { scheme, hierPart } = httpUrlToResourcePointer(config.SERVER_URL);

// auth functions
async function verifyUCAN(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<string> {
  const authHeader = request.headers.authorization;
  const requestUrl = new URL(request.originalUrl);
  if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
    throw server.httpErrors.unauthorized();
  } else {
    const encodedUcan = authHeader.substring(7, authHeader.length);
    const rootIssuerDid = rootIssuer(encodedUcan);
    const result = await ucans.verify(encodedUcan, {
      audience: config.SERVER_DID,
      isRevoked: async (_ucan) => false, // TODO => handle this case
      requiredCapabilities: [
        {
          capability: {
            with: { scheme, hierPart },
            can: {
              namespace: `http/${request.method}`,
              segments: [requestUrl.pathname],
            },
          },
          rootIssuer: rootIssuerDid,
        },
      ],
    });
    if (!result.ok) {
      throw server.httpErrors.createError(
        401,
        "Unauthorized",
        new AggregateError(result.error)
      );
    } else {
      return rootIssuerDid;
    }
  }
}

server.after(() => {
  server.withTypeProvider<ZodTypeProvider>().put("/auth/isEmailAvailable", {
    schema: { body: ZodType.email, response: { 200: z.boolean() } },
    handler: async (request, _reply) => {
      return await Service.isEmailAvailable(db, request.body);
    },
  });
  server.withTypeProvider<ZodTypeProvider>().put("/auth/isUsernameAvailable", {
    schema: { body: ZodType.username, response: { 200: z.boolean() } },
    handler: async (request, _reply) => {
      return await Service.isUsernameAvailable(db, request.body);
    },
  });
  server.withTypeProvider<ZodTypeProvider>().put("/auth/register", {
    schema: {
      body: Dto.registerRequestBody,
    },
    handler: async (request, reply) => {
      const rootIssuerDid = await verifyUCAN(request, reply);
      console.log("did", rootIssuerDid);
      return await Service.register(db, request.body, rootIssuerDid);
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
});

server.listen({ port: config.PORT }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
