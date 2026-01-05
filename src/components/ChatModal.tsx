import { useState, useRef, useEffect } from 'react';
import chatService, { ChatMessage, ChatSource } from '../services/chat.service';

interface ChatModalProps {
  userId: number;
  userName: string;
  onClose: () => void;
}

export default function ChatModal({ userId, userName, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [showSources, setShowSources] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSources([]);

    try {
      const response = await chatService.chat({
        question: input,
        conversationHistory: messages,
        userId: userId,
        useLocalLLM: false,
        searchThreshold: 0.3, // Lowered for better recall
        maxResults: 5,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSources(response.sources);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error.response?.data?.error || error.message || 'Failed to get response'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What emails did I receive recently?",
    "Show me urgent emails",
    "Find emails about meetings",
    "What's in the latest PDF attachment?",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              💬 Chat with {userName}'s Emails
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Ask questions about emails and documents
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500 mb-6">
                Ask questions about {userName}'s emails and documents
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(q)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left text-sm"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-gray-500 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sources Panel */}
        {sources.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full px-6 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition"
            >
              <span className="font-semibold text-gray-700">
                📚 Sources ({sources.length})
              </span>
              <span className="text-gray-400">{showSources ? '▼' : '▶'}</span>
            </button>
            {showSources && (
              <div className="px-6 py-4 space-y-2 max-h-32 overflow-y-auto">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="text-sm bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          {source.type === 'pdf' ? '📄' : '📧'} {source.subject}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          From: {source.source} • {new Date(source.date).toLocaleDateString()}
                        </div>
                        {source.filename && (
                          <div className="text-gray-400 text-xs">File: {source.filename}</div>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-indigo-600">
                        {(source.similarity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about emails or documents..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '➤ Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
