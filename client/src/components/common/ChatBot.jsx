import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../../api/axios";
import { useSiteContent } from "../../hooks/useSiteContent";
import { getFallbackReply } from "../../utils/chatFallback";

function ChatBot() {
  const { get } = useSiteContent();
  const whatsapp = get("contact.whatsapp", "923001234567");
  const brand = get("home.brand", "DentalCare");

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Hi! I'm the ${brand} assistant 🦷\nI can help you book a visit, share services & doctors, clinic hours, and FAQs.\n\nHow can I help today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState({ step: "idle", draft: {} });
  const [suggestions, setSuggestions] = useState([
    "Book appointment",
    "Services",
    "Doctors",
    "Clinic hours",
    "Talk to human",
  ]);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const bottomRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending, open]);

  const sendMessage = async (raw) => {
    const text = String(raw || "").trim();
    if (!text || sending) return;

    // Instant WhatsApp handoff without waiting for API
    if (/\b(talk to human|human|whatsapp|real person|agent)\b/i.test(text)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        {
          role: "bot",
          text: `Sure — a team member can help on WhatsApp.\nTap the green link below the chat, or open: https://wa.me/${whatsapp}`,
        },
      ]);
      setSuggestions(["Book appointment", "Clinic hours", "Services"]);
      setInput("");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/chat", {
        message: text,
        context,
      });
      setContext(data.context || { step: "idle", draft: {} });
      setSuggestions(data.suggestions || []);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "How can I help?" },
      ]);
      if (!open) setUnread(true);
    } catch {
      // Backend unreachable (wrong VITE_API_URL / not deployed) — still answer locally
      const fallback = getFallbackReply(text, get);
      setSuggestions(fallback.suggestions || []);
      setMessages((prev) => [...prev, { role: "bot", text: fallback.reply }]);
      if (!open) setUnread(true);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex h-[min(560px,72vh)] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_20px_50px_rgba(6,78,79,0.25)]"
          >
            <header className="flex items-center justify-between gap-3 bg-[var(--brand-deep)] px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{brand} Assistant</p>
                  <p className="text-xs text-white/70">Usually replies instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 hover:bg-white/10"
                  aria-label="Minimize chat"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 hover:bg-white/10"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[var(--paper)] p-3">
              {messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--brand)]">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-[var(--brand)] text-white"
                        : "rounded-bl-md border border-[var(--line)] bg-white text-[var(--ink)]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--mist)]">
                    <Bot size={14} />
                  </div>
                  Typing…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[var(--line)] bg-[var(--surface)] px-3 py-2">
                {suggestions.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={sending}
                    onClick={() => sendMessage(chip)}
                    className="rounded-full border border-[var(--line)] bg-[var(--mist)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-deep)] hover:border-[var(--brand)] disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-[var(--line)] bg-white p-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="field !rounded-xl !border-[var(--line)] !py-2.5 !text-sm"
                disabled={sending}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>

            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${brand}, I need help booking a visit.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 border-t border-[var(--line)] bg-[#25D366]/15 py-2.5 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/25"
            >
              <FaWhatsapp size={16} /> Talk to a human on WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-lg transition hover:scale-105 hover:bg-[var(--brand-deep)]"
        aria-label={open ? "Close chat" : "Open clinic chatbot"}
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
        {!open && unread && (
          <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white" />
        )}
      </button>
    </div>
  );
}

export default ChatBot;
