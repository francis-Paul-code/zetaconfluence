import zod from "zod";

// Zod schemas for validation
export const chatMessageSchema = zod.object({
  content: zod.string(),
  role: zod.enum(["system", "user", "assistant"]),
});

export const sendMessageSchema = zod.object({
  conversationHistory: zod.array(chatMessageSchema).optional(),
  currentChain: zod.string().optional(),
  message: zod.string().min(1, "Message cannot be empty"),
  userAddress: zod.string().optional(),
  userTokens: zod.array(zod.string()).optional(),
});
