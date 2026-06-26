import { useState, useRef, useEffect } from 'react';
import { chatApi, type ChatMessage, type ChatSource } from '../api/chat';
import { feedbackApi } from '../api/feedback';
import { useT, useLangStore } from '../stores/langStore';
import { ConfidenceIndicator, AIFeedbackBar, toast } from '@/components/ui';

// ───────────────────────────────────────
// Types
// ───────────────────────────────────────

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

// ───────────────────────────────────────
// ChatPage
// ───────────────────────────────────────

export function ChatPage() {
  const t = useT();
  const strings = useLangStore((s) => s.strings);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const now = new Date().toISOString();

    // Add user message
    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatApi.ask(question);
      const data: ChatMessage = res.data;

      const aiMsg: DisplayMessage = {
        id: data.id,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: data.created_at,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: t('chat.errorMessage'),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex-none px-4 sm:px-6 py-3 sm:py-4 border-b bg-white">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t('chat.title')}</h1>
        <p className="text-sm text-gray-500">
          {t('chat.subtitle')}
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">{t('chat.emptyTitle')}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              {t('chat.emptyDesc')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(strings.chat.suggestions as string[]).map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-sm px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>

              {/* AI-trust блок для assistant-сообщений (Phase 1' B3, 2026-05-16):
                  ConfidenceIndicator (если есть источники = likely, без = speculative)
                  + AIFeedbackBar (TRJ-033) заменяет кастомные SVG-кнопки 👍/👎. */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
                  {msg.sources && msg.sources.length > 0 ? (
                    <ConfidenceIndicator level="likely" showDisclaimer={false} />
                  ) : (
                    <ConfidenceIndicator level="speculative" showDisclaimer={false} />
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t('chat.sources')}</p>
                      {msg.sources.map((src, i) => (
                        <div key={i} className="text-xs text-gray-500 truncate">
                          {src.document_title || t('chat.document')} — {src.chunk_preview.slice(0, 60)}...
                        </div>
                      ))}
                    </div>
                  )}

                  <AIFeedbackBar
                    responseId={msg.id}
                    label=""
                    onFeedback={async (type, comment) => {
                      // Маппинг: up/down → старый chat.feedback API; flag → toast
                      if (type === 'up' || type === 'down') {
                        try {
                          await chatApi.feedback(msg.id, type);
                        } catch { /* silent */ }
                      } else {
                        // Флаг/жалоба на ответ AI — сохраняется в БД (authed клиент)
                        feedbackApi.submit({
                          kind: 'ai_chat_flag',
                          feedback: 'flag',
                          message_id: msg.id,
                          comment,
                        }).catch(() => { /* silent */ });
                      }
                      toast.success('Спасибо за отзыв');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-none border-t bg-white px-4 py-3">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.inputPlaceholder')}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
