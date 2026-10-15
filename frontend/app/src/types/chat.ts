export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
}

export interface AIResponse {
  conversationId: string;
  message: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface SendMessageRequest {
  message: string;
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
  currentChain?: string;
  userAddress?: string;
  userTokens?: string[];
}
