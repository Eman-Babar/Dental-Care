import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSiteContent } from "../../hooks/useSiteContent";

function WhatsAppFloat() {
  const { get } = useSiteContent();
  const whatsapp = get("contact.whatsapp", "923001234567");
  const brand = get("home.brand", "DentalCare");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-8 sm:right-6"
    >
      <Link
        to="/appointment"
        className="hidden rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white shadow-lg sm:inline-flex"
      >
        Book visit
      </Link>
      <a
        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${brand}, I need help booking a visit.`)}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </motion.div>
  );
}

export default WhatsAppFloat;
