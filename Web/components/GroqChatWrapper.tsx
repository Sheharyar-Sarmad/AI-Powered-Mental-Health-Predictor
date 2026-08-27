"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { fetchGroqModels, sendGroqMessage } from "@/lib/groq";
import MessageContent from "./MessageContent";

type Message = {
  role: "user" | "assistant" | "system"; 
  content: string;
  timestamp: string;
};

interface GroqChatWrapperProps {
  initialMessage?: string;
  score?: number;
  status?: string;
  recommendation?: string;
}

const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
];

function pickDefaultModel(list: string[]): string {
  return list[0] || "";
}

const iconBtnClass =
  "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-colors";

const getTimeNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function GroqChatWrapper({
  initialMessage,
  score,
  status,
  recommendation,
}: GroqChatWrapperProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessage
      ? [
          {
            role: "assistant",
            content: initialMessage,
            timestamp: getTimeNow(),
          },
        ]
      : []
  );

  const [input, setInput] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const isFirstRender = useRef(true);

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isSending]);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }
    const recognition = new (
      window as unknown as {
        webkitSpeechRecognition: new () => {
          lang: string;
          continuous: boolean;
          interimResults: boolean;
          onstart: () => void;
          onend: () => void;
          onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void;
          start: () => void;
        };
      }
    ).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.start();
  };

  const speakingRef = useRef(false);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (cancelledRef.current) return;

    window.speechSynthesis.cancel();
    const plain = text.replace(/[*#|_`>]/g, "");
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.onstart = () => {
      speakingRef.current = true;
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      speakingRef.current = false;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (message?: string) => {
    const userMessage = message ?? input;
    if (!userMessage.trim() || !selectedModel || isSending) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage, timestamp: getTimeNow() },
    ];
    setMessages(newMessages);
    setInput("");
    setIsSending(true);
    cancelledRef.current = false;
    controllerRef.current =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    try {
      const cleanMessages = newMessages.map(({ role, content }) => ({ role, content }));

      // 🔥 THE CRITICAL SYSTEM PROMPT LOGIC:
      // If we have the score, inject a system message so the AI becomes context-aware.
      const systemMessage = (score !== undefined && status && recommendation)
        ? {
            role: 'system' as const,
            content: `You are a mental health assistant. The user's latest predicted mental health score is ${score}/10 (${status}). Their personalized recommendation was: "${recommendation}". Use this specific context to provide deeply personalized, empathetic, and actionable follow-up advice to the user's questions.`
          }
        : null;

      // If we have a system message, put it at the start of the array!
      const messagesToSend = systemMessage
        ? [systemMessage, ...cleanMessages]
        : cleanMessages;

      const reply = await sendGroqMessage(
        messagesToSend,
        selectedModel,
        controllerRef.current?.signal as AbortSignal
      );
      if (cancelledRef.current) return;
      const assistantReply = reply || "Sorry, I could not process that.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantReply, timestamp: getTimeNow() },
      ]);
      speakText(assistantReply);
    } catch (error) {
      if (cancelledRef.current) return;
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to Groq.", timestamp: getTimeNow() },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    controllerRef.current?.abort();
    setIsSending(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
    setIsSpeaking(false);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "_Generation stopped._", timestamp: getTimeNow() },
    ]);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
    setIsSpeaking(false);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to download the PDF.");
      return;
    }

    const dateStr = new Date().toLocaleString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const messagesHtml = messages
      .map(
        (msg) => `
          <div class="message ${msg.role}">
            <div class="bubble">
              <p>${msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              <div class="time">${msg.timestamp}</div>
            </div>
          </div>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Mental Health Chat Log</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            .date { font-size: 12px; color: #64748b; margin-bottom: 20px; }
            .message { margin-bottom: 15px; }
            .message.user { text-align: right; }
            .message.assistant { text-align: left; }
            .bubble {
              display: inline-block;
              padding: 10px 14px;
              border-radius: 12px;
              max-width: 70%;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
            }
            .message.user .bubble { background: #10b981; color: white; border: none; }
            .time { font-size: 10px; color: #94a3b8; margin-top: 4px; text-align: right; }
            .message.user .time { color: #d1fae5; }
          </style>
        </head>
        <body>
          <h1>Mental Health Chat Log</h1>
          <div class="date">Exported on ${dateStr}</div>
          ${messagesHtml || "<p>No messages yet.</p>"}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="w-full max-w-full rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-3xl sm:p-5"
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100 sm:text-base">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20 sm:h-8 sm:w-8">
            <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </span>
          <span className="truncate">AI Chat Assistant</span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25 sm:h-8 sm:w-8"
            aria-label="Download chat as PDF"
            title="Download PDF"
          >
            <ArrowDownTrayIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>

          <AnimatePresence>
            {isSpeaking && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/20"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Speaking
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Model selector */}
      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <label className="shrink-0 text-xs font-medium tracking-wide text-slate-500">Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={modelsLoading}
          className="w-full flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 outline-none backdrop-blur-sm transition-colors focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
        >
          {models.map((model) => (
            <option key={model} value={model} className="bg-[#0b0a1a]">
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="mb-3 h-60 space-y-3 overflow-y-auto overflow-x-hidden rounded-2xl border border-white/5 bg-black/20 p-2.5 sm:h-72 sm:p-3 md:h-80 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1.5"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-700" />
            <p className="text-xs text-slate-600 sm:text-sm">Submit a prediction or start typing…</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex max-w-[90%] flex-col sm:max-w-[85%]">
                  <div
                    className={`break-words rounded-2xl px-3 py-2 shadow-sm sm:px-3.5 sm:py-2.5 ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-[0_4px_20px_-6px_rgba(16,185,129,0.6)]"
                        : "rounded-bl-sm border border-white/5 bg-white/[0.06] text-slate-200"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <MessageContent text={msg.content} />
                    ) : (
                      <p className="text-[13px] leading-relaxed sm:text-[14px]">{msg.content}</p>
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[10px] text-slate-500 ${
                      msg.role === "user" ? "self-end" : "self-start"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
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
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/5 bg-white/[0.06] px-3.5 py-2.5 sm:px-4 sm:py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-slate-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isListening ? "Listening…" : "Ask about mental health…"}
          className={`min-w-0 flex-1 basis-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-slate-100 placeholder-slate-500 outline-none backdrop-blur-sm transition-colors focus:ring-2 focus:ring-emerald-500/25 sm:basis-0 ${
            isListening ? "border-rose-400/50" : "border-white/10 focus:border-emerald-400/60"
          }`}
        />

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
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
                className={`${iconBtnClass} border-rose-400/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25`}
              >
                <XCircleIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
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
                className={`${iconBtnClass} border-transparent bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-[0_4px_20px_-6px_rgba(16,185,129,0.6)] hover:opacity-90`}
              >
                <PaperAirplaneIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={startListening}
            aria-label="Voice input"
            className={`${iconBtnClass} relative ${
              isListening
                ? "border-rose-400/40 bg-rose-500/20 text-rose-300"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-rose-500/30"
                animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <MicrophoneIcon className="relative h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              const currentlySpeaking =
                speakingRef.current ||
                (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking);

              if (currentlySpeaking) {
                stopSpeaking();
                return;
              }
              const lastReply = messages.slice().reverse().find((m) => m.role === "assistant");
              if (lastReply) speakText(lastReply.content);
            }}
            aria-label={isSpeaking ? "Stop speaking" : "Replay last reply"}
            className={`${iconBtnClass} ${
              isSpeaking
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            <StopIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}