import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiApi, ChatMessage } from '../../api/aiApi';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  context?: Record<string, any>;
}

interface MessageItem extends ChatMessage {
  id: string;
  suggestions?: string[];
  citations?: string[];
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  context = {},
}) => {
  const { user, isTeacher } = useAuth();
  const location = useLocation();

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    // Restore session-scoped conversation history
    const storageKey = `epms_ai_chat_${user?.id || user?._id || 'default'}`;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to fresh session if parsing stored JSON fails
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: isTeacher
          ? `Namaste Prof. ${user?.name || ''}. I am विद्या Helper, your EPMS Faculty Teaching Assistant. I can analyze course drop-offs, summarize student attendance risks, and draft intervention notices.`
          : `Namaste ${user?.name || ''}! I am विद्या Helper, your EPMS Academic Guide. I can help calculate attendance recovery, create personalized study plans, and explain complex lesson concepts.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state to session storage to persist conversation across page navigation
  useEffect(() => {
    const storageKey = `epms_ai_chat_${user?.id || user?._id || 'default'}`;
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, user]);

  // Handle Escape key to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Auto-scroll message feed smoothly on new messages or loading state change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Ingest initial prompt if supplied via drawer trigger
  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInputValue(initialPrompt);
      textareaRef.current?.focus();
    }
  }, [initialPrompt, isOpen]);

  const studentQuickPrompts = [
    'How is my attendance doing across courses?',
    'What lessons should I prioritize completing today?',
    'Build a 3-day recovery study plan for me',
    'How do I calculate classes needed for 75% attendance?',
  ];

  const teacherQuickPrompts = [
    'Which students currently have attendance below 75%?',
    'Summarize cohort drop-off trends across my lessons',
    'Draft an attendance warning note for at-risk students',
    'Suggest intervention strategies for inactive learners',
  ];

  const activePills = isTeacher ? teacherQuickPrompts : studentQuickPrompts;

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputValue).trim();
    if (!content || loading) return;

    setErrorMessage(null);
    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    // Maintain recent turn window for API context
    const historyPayload = newMessages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await aiApi.chat({
        message: content,
        history: historyPayload,
        context: {
          role: isTeacher ? 'teacher' : 'student',
          currentPath: location.pathname,
          userName: user?.name,
          userIdentifier: user?.identifier,
          ...context,
        },
      });

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply || 'No response generated.',
        suggestions: response.suggestions,
        citations: response.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const fallbackError =
        err?.response?.data?.message ||
        'Unable to connect to AI Assistant. Please verify server connection and try again.';
      setErrorMessage(fallbackError);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    const defaultWelcome: MessageItem = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: isTeacher
        ? `Conversation cleared. How can I assist with your classes and student monitoring today?`
        : `Conversation cleared. How can I assist with your studies or attendance today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([defaultWelcome]);
    setErrorMessage(null);
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard write failures in restricted browser environments
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="AI Assistant Drawer">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Drawer container */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className={`relative z-10 flex flex-col h-full bg-white dark:bg-navy-950 text-slate-900 dark:text-lavender-50 border-l border-slate-200 dark:border-navy-800 shadow-2xl transition-all duration-300 ${
              isExpanded ? 'w-full sm:w-[680px] lg:w-[760px]' : 'w-full sm:w-[460px] lg:w-[500px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-navy-900 dark:bg-navy-800 flex items-center justify-center border border-slate-700/60 text-cyan-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-navy-900 dark:text-lavender-50 truncate">
                      विद्या Helper
                    </h2>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-100 dark:bg-navy-800 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-navy-700">
                      {isTeacher ? 'Faculty' : 'Student'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {isTeacher ? 'Class telemetry & student intervention' : 'Attendance & academic advisory'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  aria-label="Clear conversation history"
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(prev => !prev)}
                  title={isExpanded ? 'Restore width' : 'Expand drawer'}
                  aria-label={isExpanded ? 'Restore drawer width' : 'Expand drawer width'}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:inline-flex"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Close drawer"
                  aria-label="Close AI Assistant drawer"
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-900 bg-slate-50/40 dark:bg-navy-950/40 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                <span className="text-slate-600 dark:text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  Quick:
                </span>
                {activePills.map((pill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(pill)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-md text-xs bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-800 hover:border-cyan-500 dark:hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors disabled:opacity-50"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                  >
                    <div
                      className={`relative group rounded-lg p-3.5 max-w-[92%] sm:max-w-[85%] ${
                        isUser
                          ? 'bg-navy-900 dark:bg-navy-800 text-white shadow-sm'
                          : 'bg-white dark:bg-navy-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-navy-800 shadow-sm'
                      }`}
                    >
                      {/* Copy message button */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        aria-label="Copy message text"
                        className={`absolute top-2 right-2 p-1 rounded transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                          isUser
                            ? 'text-slate-400 hover:text-white bg-navy-800'
                            : 'text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-navy-800'
                        }`}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Content */}
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap pr-5">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="pr-4">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      )}

                      {/* Citations if available */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-500">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Sources: </span>
                          {msg.citations.join(', ')}
                        </div>
                      )}

                      {/* Follow-up suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-navy-800/80 flex flex-wrap gap-1.5">
                          {msg.suggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleSendMessage(suggestion)}
                              className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-navy-800 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      {msg.timestamp && (
                        <span
                          className={`block text-[10px] mt-1.5 ${
                            isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading State */}
              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-navy-900 dark:bg-navy-800 flex items-center justify-center text-cyan-400 shrink-0 border border-slate-700/60">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    <span>Analyzing academic context & records...</span>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Request failed</p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Area */}
            <div className="p-3.5 border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isTeacher
                        ? 'Ask विद्या Helper about attendance risks, intervention notes, or class statistics...'
                        : 'Ask विद्या Helper about attendance recovery, study plans, or coursework...'
                    }
                    className="w-full resize-none px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors"
                  />
                  <span className="hidden sm:inline-block absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none">
                    Enter to send
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  aria-label="Send message"
                  className="h-10 px-3.5 rounded-lg bg-navy-900 dark:bg-navy-800 hover:bg-navy-800 dark:hover:bg-navy-700 text-white font-medium text-sm flex items-center justify-center transition-colors border border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                </button>
              </form>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIChatDrawer;
