import axios from "axios";

import { AIResponse, ChatMessage } from "../types/ai.types";

export interface AIProvider {
  sendMessage(messages: ChatMessage[], options?: any): Promise<AIResponse>;
  streamMessage?(messages: ChatMessage[], options?: any): Promise<any>;
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private apiUrl = "https://api.openai.com/v1/chat/completions";
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: any
  ): Promise<AIResponse> {
    const response = await axios.post(
      this.apiUrl,
      {
        max_tokens: options?.max_tokens || 1000,
        messages,
        model: this.model,
        temperature: options?.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      conversationId: response.data.id,
      message: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async streamMessage(messages: ChatMessage[], options?: any): Promise<any> {
    return axios.post(
      this.apiUrl,
      {
        max_tokens: options?.max_tokens || 1000,
        messages,
        model: this.model,
        stream: true,
        temperature: options?.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );
  }
}

/**
 * Anthropic (Claude) Provider
 * Uncomment and configure when ready to use
 */
export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private apiUrl = "https://api.anthropic.com/v1/messages";
  private model: string;

  constructor(apiKey: string, model: string = "claude-3-5-sonnet-20241022") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: any
  ): Promise<AIResponse> {
    // Convert messages format for Claude
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        content: m.content,
        role: m.role,
      }));

    const response = await axios.post(
      this.apiUrl,
      {
        max_tokens: options?.max_tokens || 1000,
        messages: conversationMessages,
        model: this.model,
        system: systemMessage?.content || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": this.apiKey,
        },
      }
    );

    return {
      conversationId: response.data.id,
      message: response.data.content[0].text,
      usage: {
        completion_tokens: response.data.usage.output_tokens,
        prompt_tokens: response.data.usage.input_tokens,
        total_tokens:
          response.data.usage.input_tokens + response.data.usage.output_tokens,
      },
    };
  }

  async streamMessage(messages: ChatMessage[], options?: any): Promise<any> {
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        content: m.content,
        role: m.role,
      }));

    return axios.post(
      this.apiUrl,
      {
        max_tokens: options?.max_tokens || 1000,
        messages: conversationMessages,
        model: this.model,
        stream: true,
        system: systemMessage?.content || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": this.apiKey,
        },
        responseType: "stream",
      }
    );
  }
}

/**
 * DeepSeek Provider
 * DeepSeek uses OpenAI-compatible API
 */
export class DeepSeekProvider implements AIProvider {
  private apiKey: string;
  private apiUrl = "https://api.deepseek.com/v1/chat/completions";
  private model: string;

  constructor(apiKey: string, model: string = "deepseek-chat") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: any
  ): Promise<AIResponse> {
    const response = await axios.post(
      this.apiUrl,
      {
        max_tokens: options?.max_tokens || 1000,
        messages,
        model: this.model,
        temperature: options?.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      conversationId: response.data.id,
      message: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async streamMessage(messages: ChatMessage[], options?: any): Promise<any> {
    return axios.post(
      this.apiUrl,
      {
        max_tokens: options?.max_tokens || 1000,
        messages,
        model: this.model,
        stream: true,
        temperature: options?.temperature || 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );
  }
}

/**
 * Provider Factory
 * Creates the appropriate provider based on configuration
 */
export class AIProviderFactory {
  static createProvider(
    providerName: string = "openai",
    model?: string
  ): AIProvider {
    switch (providerName.toLowerCase()) {
      case "openai":
        const openaiKey = process.env.OPENAI_API_KEY || "";
        return new OpenAIProvider(openaiKey, model || "gpt-4o-mini");

      case "anthropic":
      case "claude":
        const anthropicKey = process.env.ANTHROPIC_API_KEY || "";
        return new AnthropicProvider(
          anthropicKey,
          model || "claude-3-5-sonnet-20241022"
        );

      case "deepseek":
        const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
        return new DeepSeekProvider(deepseekKey, model || "deepseek-chat");

      default:
        throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }
}
