import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bot, Send, UserRound } from "lucide-react";
import api from "../../api/axios";

const STARTER = {
  role: "bot",
  text: "Hi! I'm the DentalCare assistant.\nI can share services, doctors, your appointments, clinic info — and book a visit for you.\n\nTry: Book appointment",
};

function PatientChat() {
  const [messages, setMessages] = useState([STARTER]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState({ step: "idle", draft: {} });
  const [suggestions, setSuggestions] = useState([
    "Book appointment",
    "Services",
    "Doctors",
    "My appointments",
    "Clinic hours",
  ]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (raw) => {
    const text = String(raw || "").trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/patient/chat", {
        message: text,
        context,
      });
      setContext(data.context || { step: "idle", draft: {} });
      setSuggestions(data.suggestions || []);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "How can I help?" },
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Chat failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, I had trouble responding. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-3xl flex-col sm:h-[calc(100dvh-10rem)]">
      <div className="mb-3 shrink-0 sm:mb-4">
        <h2 className="font-display text-xl font-semibold text-[var(--ink)] sm:text-2xl">
          Clinic assistant
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Book visits, check services &amp; doctors, or type &quot;My
          appointments&quot; to see all your bookings.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-4 md:p-6">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex gap-2 sm:gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "bot" && (
                <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--brand)] sm:flex">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed sm:max-w-[85%] sm:px-4 sm:py-3 ${
                  msg.role === "user"
                    ? "bg-[var(--brand)] text-white"
                    : "bg-[var(--paper)] text-[var(--ink)]"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white sm:flex">
                  <UserRound size={16} />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <p className="text-xs text-[var(--muted)]">Assistant is typing…</p>
          )}
          <div ref={bottomRef} />
        </div>

        {suggestions.length > 0 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto overscroll-x-contain border-t border-[var(--line)] px-3 py-2.5 sm:flex-wrap sm:overflow-visible sm:px-4 sm:py-3">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => sendMessage(item)}
                className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--brand-deep)] hover:bg-[var(--mist)]"
                disabled={sending}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 gap-2 border-t border-[var(--line)] p-2.5 sm:p-3 md:p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field !py-2.5 sm:!py-[0.85rem]"
            placeholder="Type a message… e.g. Book appointment"
            disabled={sending}
          />
          <button
            type="submit"
            className="btn-primary shrink-0 !px-3 sm:!px-4"
            disabled={sending || !input.trim()}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default PatientChat;
