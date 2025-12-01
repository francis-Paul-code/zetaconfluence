import type { ChatMessage } from '../types/chat';
import { backendAxiosInstance } from '../utils/axios';

export const sendChatMessage = async ({
  message,
  history,
}: {
  message: string;
  history: ChatMessage[];
}) => {
  try {
    const response = await backendAxiosInstance.post('/ai/chat', {
      message,
      conversationHistory: history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Add assistant response
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.data.data.message,
      timestamp: Date.now(),
    };
    return assistantMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage: ChatMessage = {
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: Date.now(),
    };

    return errorMessage;
  }
};
