import { useEffect, useState } from "react";
import api from "../../api/axios";

/**
 * Shows CMS bank/JazzCash instructions + whether Stripe is available.
 */
function PaymentInstructions({ className = "" }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api
      .get("/payments/config")
      .then(({ data }) => setConfig(data))
      .catch(() =>
        setConfig({
          paymentEnabled: true,
          heading: "How to pay your deposit",
          instructions: "",
          stripeEnabled: false,
        })
      );
  }, []);

  if (!config || config.paymentEnabled === false) return null;

  return (
    <aside
      className={`rounded-xl border border-[var(--line)] bg-[var(--mist)]/50 p-4 ${className}`}
    >
      <h3 className="font-display text-lg font-semibold text-[var(--brand-deep)]">
        {config.heading}
      </h3>
      {config.instructions ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
          {config.instructions}
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ask the clinic for deposit payment details after booking.
        </p>
      )}
      {config.stripeEnabled && (
        <p className="mt-3 text-xs font-medium text-[var(--ok)]">
          Online card deposit is available from your patient portal.
        </p>
      )}
    </aside>
  );
}

export default PaymentInstructions;
