import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { chatContext, userContext } from "../constants/contexts";
import { ChatMessage, ChatRequest, OpenAIResponse } from "../types/ai.types";

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL =
  process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini"; // Can be changed to gpt-4, deepseek-chat, etc.

export const sendMessage = async (
  request: FastifyRequest<{ Body: ChatRequest }>,
  reply: FastifyReply
) => {
  try {
    const {
      message,
      conversationHistory = [],
      userAddress,
      currentChain,
      userTokens,
    } = request.body;

    if (!message || message.trim().length === 0) {
      return reply.status(400).send({
        error: "Message is required",
        success: false,
      });
    }

    const systemContext = chatContext();
    const userSpecificContext = userContext({
      currentChain,
      userAddress,
      userTokens,
    });

    const messages: ChatMessage[] = [
      {
        content: `${systemContext}\n\n${userSpecificContext}`,
        role: "system",
      },
      ...conversationHistory,
      {
        content: message,
        role: "user",
      },
    ];

    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        max_tokens: 1000,
        messages,
        model: DEFAULT_MODEL,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    return reply.status(200).send({
      data: {
        conversationId: response.data.id,
        message: aiResponse,
        usage: response.data.usage,
      },
      success: true,
    });
  } catch (error: any) {
    console.error(
      "Error in sendMessage:",
      error.response?.data || error.message
    );

    return reply.status(500).send({
      error:
        error.response?.data?.error?.message ||
        "Failed to process chat message",
      success: false,
    });
  }
};

export const streamMessage = async (
  request: FastifyRequest<{ Body: ChatRequest }>,
  reply: FastifyReply
) => {
  try {
    const {
      message,
      conversationHistory = [],
      userAddress,
      currentChain,
      userTokens,
    } = request.body;

    if (!message || message.trim().length === 0) {
      return reply.status(400).send({
        error: "Message is required",
        success: false,
      });
    }

    const systemContext = chatContext();
    const userSpecificContext = userContext({
      currentChain,
      userAddress,
      userTokens,
    });

    const messages: ChatMessage[] = [
      {
        content: `${systemContext}\n\n${userSpecificContext}`,
        role: "system",
      },
      ...conversationHistory,
      {
        content: message,
        role: "user",
      },
    ];

    // Set headers for SSE
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    const response = await axios.post(
      OPENAI_API_URL,
      {
        max_tokens: 1000,
        messages,
        model: DEFAULT_MODEL,
        stream: true,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    response.data.on("data", (chunk: Buffer) => {
      reply.raw.write(chunk);
    });

    response.data.on("end", () => {
      reply.raw.end();
    });

    response.data.on("error", (error: Error) => {
      console.error("Stream error:", error);
      reply.raw.end();
    });
  } catch (error: any) {
    console.error(
      "Error in streamMessage:",
      error.response?.data || error.message
    );

    return reply.status(500).send({
      error: "Failed to stream chat message",
      success: false,
    });
  }
};

export const getModels = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const models = [
      {
        description: "Most capable model, best for complex queries",
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "OpenAI",
      },
      {
        description: "Fast and efficient, good for most queries",
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
      },
      {
        description: "Quick responses, cost-effective",
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "OpenAI",
      },
    ];

    return reply.status(200).send({
      data: models,
      success: true,
    });
  } catch (error: any) {
    console.error("Error in getModels:", error.message);

    return reply.status(500).send({
      error: "Failed to fetch models",
      success: false,
    });
  }
};
