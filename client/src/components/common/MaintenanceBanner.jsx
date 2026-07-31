import { Link } from "react-router-dom";
import { useSiteContent } from "../../hooks/useSiteContent";

function isOn(value) {
  return ["true", "1", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function MaintenanceBanner() {
  const { get } = useSiteContent();
  if (!isOn(get("site.maintenance", "false"))) return null;

  const message = get(
    "site.maintenance_message",
    "Online booking is temporarily paused. Please contact the clinic."
  );
  const phone = get("contact.phone", "");
  const whatsapp = get("contact.whatsapp", "");

  return (
    <div className="border-b border-[var(--line)] bg-[#064e4f] px-4 py-2.5 text-center text-sm text-white">
      <p className="mx-auto max-w-4xl">
        {message}
        {phone ? (
          <>
            {" "}
            <a className="underline underline-offset-2" href={`tel:${phone.replace(/\s/g, "")}`}>
              Call
            </a>
          </>
        ) : null}
        {whatsapp ? (
          <>
            {" · "}
            <a
              className="underline underline-offset-2"
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </>
        ) : null}
        {" · "}
        <Link className="underline underline-offset-2" to="/contact">
          Contact
        </Link>
      </p>
    </div>
  );
}

export default MaintenanceBanner;
