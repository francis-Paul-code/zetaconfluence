export interface ChatMessage {
  content: string;
  role: "assistant" | "system" | "user";
}

export interface ChatRequest {
  conversationHistory?: ChatMessage[];
  currentChain?: string;
  message: string;
  model?: string;
  provider?: "anthropic" | "deepseek" | "openai";
  userAddress?: string;
  userTokens?: string[];
}

export interface ChatResponse {
  data?: {
    conversationId?: string;
    message: string;
    usage?: TokenUsage;
  };
  error?: string;
  success: boolean;
}

export interface OpenAIResponse {
  choices: Array<{
    finish_reason: string;
    message: {
      content: string;
      role: string;
    };
  }>;
  id: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ChatMessage {
  content: string;
  role: "assistant" | "system" | "user";
}

export interface AIResponse {
  conversationId?: string;
  message: string;
  usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface TokenUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

export interface AIModel {
  costPer1kTokens?: {
    input: number;
    output: number;
  };
  description: string;
  id: string;
  maxTokens?: number;
  name: string;
  provider: string;
}

export interface UserContextParams {
  currentChain?: string;
  userAddress?: string;
  userLoans?: {
    active: number;
    asBorrower: number;
    asLender: number;
    completed: number;
  };
  userTokens?: string[];
}

export interface ConversationContext {
  conversationHistory: ChatMessage[];
  systemContext: string;
  userContext: string;
}

export type AIProviderType = "anthropic" | "deepseek" | "openai";

export interface AIProviderConfig {
  apiKey: string;
  maxTokens?: number;
  model: string;
  provider: AIProviderType;
  temperature?: number;
}
