import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  question: string;
  conversationHistory?: ChatMessage[];
  useLocalLLM?: boolean;
  searchThreshold?: number;
  maxResults?: number;
  userId?: number; // Filter by specific user's emails
}

export interface ChatSource {
  type: 'email' | 'pdf';
  subject: string;
  source: string;
  date: string;
  similarity: number;
  filename?: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: ChatSource[];
  conversationHistory: ChatMessage[];
}

class ChatService {
  /**
   * Send a question to the RAG chat API
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat', request);
    return response.data;
  }

  /**
   * Get chat history (if implemented)
   */
  async getChatHistory(): Promise<ChatMessage[]> {
    const response = await api.get('/chat/history');
    return response.data.history || [];
  }
}

export const chatService = new ChatService();
export default chatService;
