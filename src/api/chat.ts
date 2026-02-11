import { api } from './client';

export interface ChatSource {
  document_id: string;
  document_title: string | null;
  chunk_preview: string;
  similarity: number | null;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  sources: ChatSource[];
  model: string;
  tokens_used: number;
  created_at: string;
}

export const chatApi = {
  ask: (question: string, useRag = true, useMock = false) =>
    api.post<ChatMessage>('/api/v1/chat/ask', {
      question,
      use_rag: useRag,
      use_mock: useMock,
    }),

  feedback: (messageId: string, rating: 'up' | 'down', comment?: string) =>
    api.post('/api/v1/chat/feedback', {
      message_id: messageId,
      rating,
      comment,
    }),
};
