import "dotenv/config"; // this loads .env values in process.env
import fs from "fs";
import fastify, { type FastifyRequest, type FastifyReply } from "fastify";
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
// ! WARNING: will not work if there are queryParams. We only use JSON body requests.
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
      isRevoked: async (_ucan) => false, // all our UCAN are short-lived so the revocation feature is unnecessary
      requiredCapabilities: [
        {
          capability: {
            // with: {
            //   scheme: "wnfs",
            //   hierPart: "//boris.fission.name/public/photos/",
            // },
            // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
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
  server.withTypeProvider<ZodTypeProvider>().put("/auth/isEmailAvailable", {
    schema: { body: ZodType.email, response: { 200: z.boolean() } },
    handler: async (request, _reply) => {
      return await Service.isEmailAvailable(db, request.body);
    },
  });
  server.withTypeProvider<ZodTypeProvider>().put("/auth/register", {
    schema: {
      body: Dto.registerRequestBody,
    },
    handler: async (request, reply) => {
      const rootIssuerDid = await verifyUCAN(request, reply);

      const isEmailAvailable = await Service.isEmailAvailable(
        db,
        request.body.email
      );
      if (!isEmailAvailable) {
        throw server.httpErrors.conflict("email unavailable");
      }

      const isDidWriteAvailable = await Service.isDidWriteAvailable(
        db,
        rootIssuerDid
      );
      if (!isDidWriteAvailable) {
        throw server.httpErrors.conflict("didWrite unavailable");
      }

      const isDidExchangeAvailable = await Service.isDidExchangeAvailable(
        db,
        request.body.didExchange
      );
      if (!isDidExchangeAvailable) {
        throw server.httpErrors.conflict("didExchange unavailable");
      }
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
