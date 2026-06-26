import { api } from './client';

/**
 * AI-feedback (оценки 👍/👎/флаг на AI-ответы и сгенерированный контент).
 * Раньше слалось через `fetch('/api/v1/feedback')` — относительный URL без токена
 * + эндпоинта не было → терялось. Теперь через authed axios-клиент → сохраняется.
 */
export const feedbackApi = {
  submit: (payload: {
    kind?: string;
    feedback?: 'up' | 'down' | 'flag';
    rating?: 'up' | 'down' | 'flag';
    message_id?: string;
    comment?: string;
    context?: Record<string, unknown>;
  }) => api.post('/api/v1/feedback', payload),
};
