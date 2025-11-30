import { FastifyInstance } from "fastify";

import ai from "./ai";
import user from "./user";

export default async (fastify: FastifyInstance) => {
  fastify.register(user, { prefix: "/user" });
  fastify.register(ai, { prefix: "/ai" });
};
