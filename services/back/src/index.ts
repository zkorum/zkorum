import "dotenv/config"; // this loads .env values in process.env
import fs from "fs";
import fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import fastifyAuth from "@fastify/auth";
import fastifySensible from "@fastify/sensible";
import fastifySwagger from "@fastify/swagger";
import fastifyCors from "@fastify/cors";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { AuthenticateType, Service } from "./service.js";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { DrizzleFastifyLogger } from "./logger.js";
import { z } from "zod";
import { ZodType } from "./shared/types/zod.js";
import { Dto } from "./dto.js";
import * as ucans from "@ucans/ucans";
import {
  httpMethodToAbility,
  httpUrlToResourcePointer,
} from "./shared/ucan/ucan.js";

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

// auth functions
// TODO: store UCAN in ucan table at the end and check whether UCAN has already been seen in the ucan table on the first place - if yes, throw unauthorized error and log the potential replay attack attempt.
// TODO: optionally check whether didWrite already exists in DB and is logged in - not necessary for "authenticate" endpoint for example
// ! WARNING: will not work if there are queryParams. We only use POST requests and JSON body requests (JSON-RPC style).
async function verifyUCAN(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<string> {
  const authHeader = request.headers.authorization;
  if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
    throw server.httpErrors.unauthorized();
  } else {
    const { scheme, hierPart } = httpUrlToResourcePointer(
      new URL(request.originalUrl, config.SERVER_URL)
    );
    const encodedUcan = authHeader.substring(7, authHeader.length);
    const rootIssuerDid = ucans.parse(encodedUcan).payload.iss;
    const result = await ucans.verify(encodedUcan, {
      audience: config.SERVER_DID,
      isRevoked: async (_ucan) => false, // users generated UCANs are short-lived action-specific one-time token so the revocation feature is unnecessary
      requiredCapabilities: [
        {
          capability: {
            with: { scheme, hierPart },
            can: httpMethodToAbility(request.method),
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
  server.withTypeProvider<ZodTypeProvider>().post("/auth/getUserId", {
    schema: {
      body: ZodType.email,
      response: { 200: ZodType.userId },
    },
    handler: async (request, _reply) => {
      // This endpoint is accessible without being logged in
      // ==> TODO: rate-limit it (via IP Address)
      return await Service.getUserId(db, request.body);
    },
  });
  server.withTypeProvider<ZodTypeProvider>().post("/auth/authenticate", {
    schema: {
      body: Dto.authenticateRequestBody,
      response: { 200: Dto.authenticateResponse },
    },
    handler: async (request, reply) => {
      // This endpoint is accessible without being logged in
      // => TODO: rate-limit it (via IP Address)
      // this endpoint could be especially subject to attacks such as DoS or man-in-the-middle (to associate their own DID instead of the legitimate user's ones for example)
      // => TODO: restrict this endpoint and the "validate email" endpoint to use same IP Address: the correct IP Address must part of the UCAN
      // => TODO: allow email owners to report spam/attacks and to request blocking the IP Addresses that attempted access
      // The web infrastructure is as it is and IP Addresses are the backbone over which our HTTP endpoints function, we can avoid storing/logging IP Addresses as much as possible, but we can't fix it magically
      // As a social network (hopefully) subject to heavy traffic, the whole app will need to be protected via a privacy-preserving alternative to CAPTCHA anyway, such as Turnstile: https://developers.cloudflare.com/turnstile/
      // => TODO: encourage users to use a mixnet such as Tor to preserve their privacy.
      const didWrite = await verifyUCAN(request, reply);
      const authenticateType = await Service.getAuthenticateType(
        db,
        request.body,
        didWrite,
        server.httpErrors
      );
      switch (authenticateType) {
        case AuthenticateType.REGISTER:
          return await Service.registerAttempt(db, request.body, didWrite).then(
            ({ codeExpiry }) => {
              // backend intentionally does NOT send whether it is a register or a login, and does not send the address the email is sent to - in order to protect privacy and give no information to potential attackers
              return {
                codeExpiry: codeExpiry,
              };
            }
          );
        case AuthenticateType.LOGIN_KNOWN_DEVICE:
          // TODO
          return {
            codeExpiry: new Date(),
          };
        case AuthenticateType.LOGIN_NEW_DEVICE:
          // TODO
          return {
            codeExpiry: new Date(),
          };
      }
    },
  });

  // TODO: for now, there is no 2FA so when this returns true, it means the user has finished logging in/registering - but it will change
  // TODO: for now there is no way to communicate "isTrusted", it's set to true automatically - but it will change
  server.withTypeProvider<ZodTypeProvider>().post("/auth/validateOtp", {
    schema: {
      body: Dto.validateOtpReqBody,
      response: { 200: Dto.validateOtpResponse },
    },
    handler: async (request, reply) => {
      const didWrite = await verifyUCAN(request, reply);
      return await Service.validateOtp(
        db,
        didWrite,
        request.body.code,
        server.httpErrors
      );
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
