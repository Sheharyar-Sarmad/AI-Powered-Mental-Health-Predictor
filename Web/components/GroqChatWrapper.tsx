'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { fetchGroqModels, sendGroqMessage } from '@/lib/api';
import MessageContent from './MessageContent';

type Message = { role: 'user' | 'assistant'; content: string };

interface GroqChatWrapperProps {
  initialMessage?: string; // e.g., prediction result to start the chat
}

const FALLBACK_MODELS = ['compound-beta', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];

/** Prefer a "compound" model if one exists in the returned list, else first item. */
function pickDefaultModel(list: string[]): string {
  const compound = list.find((m) => m.toLowerCase().includes('compound'));
  return compound || list[0] || '';
}

export default function GroqChatWrapper({ initialMessage }: GroqChatWrapperProps) {
  // ---------- State ----------
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  // ---------- Fetch models on mount ----------
  useEffect(() => {
    const loadModels = async () => {
      try {
        const list = await fetchGroqModels();
        setModels(list);
        setSelectedModel(pickDefaultModel(list));
      } catch {
        setModels(FALLBACK_MODELS);
        setSelectedModel(pickDefaultModel(FALLBACK_MODELS));
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, []);

  // ---------- Set initial message when provided ----------
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{ role: 'assistant', content: initialMessage }]);
    }
  }, [initialMessage, messages.length]);

  // ---------- Auto-scroll to bottom ----------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // ---------- Voice Recognition ----------
  // Fills the text field only — the user reviews and decides to send.
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser.');
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.start();
  };

  // ---------- Text-to-Speech ----------
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) window.speechSynthesis.cancel();
    const plain = text.replace(/[*#|_`>]/g, '');
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // ---------- Send message ----------
  const handleSend = async (message?: string) => {
    const userMessage = message ?? input;
    if (!userMessage.trim() || !selectedModel || isSending) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);
    cancelledRef.current = false;
    controllerRef.current = typeof AbortController !== 'undefined' ? new AbortController() : null;

    try {
      const reply = await sendGroqMessage(newMessages, selectedModel, controllerRef.current?.signal as any);
      if (cancelledRef.current) return; // discard — user stopped generation
      const assistantReply = reply || 'Sorry, I could not process that.';
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
      speakText(assistantReply);
    } catch (error) {
      if (cancelledRef.current) return;
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to Groq.' }]);
    } finally {
      setIsSending(false);
    }
  };

  // ---------- Cancel in-flight generation ----------
  const handleCancel = () => {
    cancelledRef.current = true;
    controllerRef.current?.abort();
    setIsSending(false);
    setMessages((prev) => [...prev, { role: 'assistant', content: '_Generation stopped._' }]);
  };

  // ---------- Render ----------
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
            <ChatBubbleLeftRightIcon className="h-4.5 w-4.5" />
          </span>
          AI Chat Assistant
        </h3>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isSpeaking && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 ring-1 ring-cyan-400/20"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </span>
                Speaking
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Model selector */}
      <div className="mb-3 flex items-center gap-2">
        <label className="text-xs font-medium tracking-wide text-slate-500">Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={modelsLoading}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 outline-none backdrop-blur-sm transition-colors focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25 disabled:opacity-50"
        >
          {models.map((model) => (
            <option key={model} value={model} className="bg-[#0b0a1a]">
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="mb-3 h-72 space-y-3 overflow-y-auto rounded-2xl border border-white/5 bg-black/20 p-3 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1.5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-700" />
            <p className="text-sm text-slate-600">Submit a prediction or start typing…</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_4px_20px_-6px_rgba(139,92,246,0.6)]'
                      : 'rounded-bl-sm border border-white/5 bg-white/[0.06] text-slate-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <MessageContent text={msg.content} />
                  ) : (
                    <p className="text-[14px] leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/5 bg-white/[0.06] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-slate-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? 'Listening…' : 'Ask about mental health…'}
          className={`flex-1 rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-slate-100 placeholder-slate-500 outline-none backdrop-blur-sm transition-colors focus:ring-2 focus:ring-violet-500/25 ${
            isListening ? 'border-rose-400/50' : 'border-white/10 focus:border-violet-400/60'
          }`}
        />

        {/* Send / Cancel toggles depending on generation state */}
        <AnimatePresence mode="wait" initial={false}>
          {isSending ? (
            <motion.button
              key="cancel"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleCancel}
              aria-label="Stop generating"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/15 text-rose-300 transition-colors hover:bg-rose-500/25"
            >
              <XCircleIcon className="h-5 w-5" />
            </motion.button>
          ) : (
            <motion.button
              key="send"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleSend()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_4px_20px_-6px_rgba(139,92,246,0.6)] transition-opacity hover:opacity-90"
            >
              <PaperAirplaneIcon className="h-4.5 w-4.5" />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={startListening}
          aria-label="Voice input"
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            isListening
              ? 'border-rose-400/40 bg-rose-500/20 text-rose-300'
              : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
          }`}
        >
          {isListening && (
            <motion.span
              className="absolute inset-0 rounded-xl bg-rose-500/30"
              animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <MicrophoneIcon className="relative h-4.5 w-4.5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            const lastReply = messages.slice().reverse().find((m) => m.role === 'assistant');
            if (lastReply) speakText(lastReply.content);
          }}
          aria-label="Replay last reply"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08]"
        >
          <StopIcon className="h-4.5 w-4.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}