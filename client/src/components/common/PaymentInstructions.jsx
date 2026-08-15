import { useEffect, useState } from "react";
import api from "../../api/axios";

/**
 * Shows clinic-only payment instructions (no online card pay).
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
          heading: "Pay at the clinic",
          instructions:
            "Please pay your visit / deposit at the clinic reception. Online payments are not available.",
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
          Please pay at the clinic reception on the day of your visit.
        </p>
      )}
      <p className="mt-3 text-xs font-medium text-[var(--brand-deep)]">
        Online payments are disabled — clinic pay only.
      </p>
    </aside>
  );
}

export default PaymentInstructions;
