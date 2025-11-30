import cors from "@fastify/cors";
import env from "@fastify/env";
import formBody from "@fastify/formbody";
import response from "@fastify/response-validation";
import static_plugin from "@fastify/static";
import swagger from "@fastify/swagger";
import swagger_ui from "@fastify/swagger-ui";
import { fastify, HookHandlerDoneFunction } from "fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { join } from "path";

import config from "../configs/index";
import routes from "../routes/index";

export default async (silent: boolean = false) => {
  try {
    const { host, port } = config.app;
    const { keys, prefix } = config.api;

    const baseApiUrl = "/" + prefix.replace("/", "");

    const app = fastify({
      ignoreDuplicateSlashes: true,
      ignoreTrailingSlash: true,
    });

    // Register plugins
    await Promise.all([
      app.register(cors, { origin: "*" }),
      // app.register(socket_io, {
      //   // put your options here
      //   cors: {
      //     origin: '*', // Allow all origins (you can restrict as needed)
      //     methods: ['GET', 'POST'],
      //   },
      // }),
      app.register(swagger, {
        openapi: {
          info: {
            description: "API Documentation",
            title: "API Documentation",
            version: "1.0.0",
          },
          openapi: "3.0.0",
        },
        prefix: "/docs",
        swagger: {
          info: {
            description: "API Documentation",
            title: "API Docs",
            version: "1.0.0",
          },
        },
        transform: jsonSchemaTransform,
      }),
      app.register(swagger_ui, { routePrefix: "/swagger-ui" }),
      app.register(static_plugin, { root: join(process.cwd(), "public") }),
      app.register(response),
      app.register(env, {
        dotenv: true,
        schema: {
          properties: {
            API_JSON_LIMIT: { type: "string" },
            API_KEYS: { type: "string" },
            API_VERSION: { default: "v1.0.0", type: "string" },
            HOST_URL: { type: "string" },
            PORT: { default: "8910", type: "string" },
            RATE_LIMIT_MAX: { default: 50, type: "number" },
            RATE_LIMIT_WINDOW: { default: "1 minute", type: "string" },
          },
          required: [
            "PORT",
            "HOST_URL",
            "API_JSON_LIMIT",
            "API_KEYS",
            "RATE_LIMIT_MAX",
            "RATE_LIMIT_WINDOW",
          ],
          type: "object",
        },
      }),
      app.register(formBody),

      app.setValidatorCompiler(validatorCompiler),
      app.setSerializerCompiler(serializerCompiler),
      app.withTypeProvider<ZodTypeProvider>().register(routes, { prefix }),
    ]);
    app.decorate(
      "allowAnonymous", // Hook grants route encapsulated in an authenticated context annonymity
      (req: FastifyRequest, _: FastifyReply, done: HookHandlerDoneFunction) => {
        if (req.headers.authorization) {
          return done(new Error("not anonymous"));
        }
        done();
      }
    );

    app.route({
      handler: (request, reply) => {
        reply.status(200).send({ message: "Hello! You Have Reached Us." });
      },
      method: "GET",
      url: "/",
    });

    // Start server
    app.listen({ host, port }, (err, address) => {
      if (err) {
        console.error("An error occurred:", err.message);
        process.exit(1);
      }
      console.log(`Server listening on PORT: ${port}`);
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("Error during server setup:", error);
    process.exit(1);
  }
};
