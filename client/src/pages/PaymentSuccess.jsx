import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/common/Loader";

function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Missing payment session.");
      setLoading(false);
      return;
    }

    api
      .get("/payments/confirm", { params: { session_id: sessionId } })
      .then(({ data }) => {
        setAppointment(data.appointment);
        toast.success(data.message || "Payment confirmed");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not confirm payment");
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
        {error ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">
              Payment not confirmed
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">{error}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">
              Deposit paid
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Thanks — your deposit for appointment #{appointment?.id} is
              confirmed.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {appointment?.id && (
            <Link
              to={`/receipt/${appointment.id}`}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              View receipt
            </Link>
          )}
          <Link to="/patient" className="btn-secondary !px-4 !py-2 text-sm">
            Patient portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
