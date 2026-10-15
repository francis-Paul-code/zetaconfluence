import { FastifyInstance } from "fastify";
import zod from "zod";

import { getModels, sendMessage, streamMessage } from "../controllers/ai";
import { sendMessageSchema } from "../utils/schemas";

export default async (fastify: FastifyInstance) => {
  fastify.route({
    handler: sendMessage,
    method: "POST",
    schema: {
      body: sendMessageSchema,
      description: "Send a message to the AI assistant",
      // response: {
      //   200: zod.object({
      //     data: zod.object({
      //       conversationId: zod.string(),
      //       message: zod.string(),
      //       usage: zod.object({
      //         completion_tokens: zod.number(),
      //         prompt_tokens: zod.number(),
      //         total_tokens: zod.number(),
      //       }),
      //     }),
      //     success: zod.boolean(),
      //   }),
      //   400: zod.object({
      //     error: zod.string(),
      //     success: zod.boolean(),
      //   }),
      //   500: zod.object({
      //     error: zod.string(),
      //     success: zod.boolean(),
      //   }),
      // },
      tags: ["AI"],
    },
    url: "/chat",
  });

  fastify.route({
    handler: streamMessage,
    method: "POST",
    schema: {
      body: sendMessageSchema,
      description: "Stream a message response from the AI assistant",
      tags: ["AI"],
    },
    url: "/stream",
  });

  fastify.route({
    handler: getModels,
    method: "GET",
    schema: {
      description: "Get list of available AI models",
      // response: {
      //   200: zod.object({
      //     data: zod.array(
      //       zod.object({
      //         description: zod.string(),
      //         id: zod.string(),
      //         name: zod.string(),
      //         provider: zod.string(),
      //       })
      //     ),
      //     success: zod.boolean(),
      //   }),
      // },
      tags: ["AI"],
    },

    url: "/models",
  });
};
