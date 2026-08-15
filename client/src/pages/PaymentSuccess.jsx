import { Link } from "react-router-dom";

/**
 * Legacy Stripe return URL — online pay is disabled (clinic pay only).
 */
function PaymentSuccess() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">
          Online payment unavailable
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Please pay at the clinic reception. Online card payments are not
          available.
        </p>
        <Link
          to="/patient/appointments"
          className="mt-6 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
        >
          Back to appointments
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
