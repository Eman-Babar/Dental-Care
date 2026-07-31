import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../utils/storage";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Receipt() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/payments/receipt/${id}`)
      .then(({ data: res }) => setData(res))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Could not load receipt")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!data?.appointment) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-[var(--muted)]">Receipt not found.</p>
      </div>
    );
  }

  const a = data.appointment;
  const back = user ? dashboardPathForRole(user.role) : "/";

  return (
    <div className="page-shell min-h-screen bg-[var(--paper)] px-4 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto mb-4 flex max-w-xl gap-2 print:hidden">
        <Link to={back} className="btn-secondary !px-4 !py-2 text-sm">
          Back
        </Link>
        <button
          type="button"
          className="btn-primary !px-4 !py-2 text-sm"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>
      </div>

      <article className="mx-auto max-w-xl border border-[var(--line)] bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-[var(--line)] pb-4">
          <p className="font-display text-2xl font-semibold text-[var(--brand-deep)]">
            {data.brand}
          </p>
          {data.address && (
            <p className="mt-1 text-sm text-[var(--muted)]">{data.address}</p>
          )}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Payment receipt · #{a.id}
          </p>
        </header>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Patient</dt>
            <dd className="font-medium text-[var(--ink)]">{a.patient?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Service</dt>
            <dd className="font-medium text-[var(--ink)]">
              {a.service?.title || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Doctor</dt>
            <dd className="font-medium text-[var(--ink)]">
              {a.doctor?.name || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Visit</dt>
            <dd className="font-medium text-[var(--ink)]">
              {formatDate(a.appointmentDate)} · {a.appointmentTime}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Payment status</dt>
            <dd className="font-semibold uppercase text-[var(--brand)]">
              {(a.paymentStatus || "UNPAID").replace(/_/g, " ")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Deposit</dt>
            <dd className="font-medium">
              {a.depositAmount != null ? `Rs ${a.depositAmount}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Amount paid</dt>
            <dd className="font-medium">
              {a.amountPaid != null ? `Rs ${a.amountPaid}` : "Rs 0"}
            </dd>
          </div>
          {a.paymentNote && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Note</dt>
              <dd className="max-w-[60%] text-right text-[var(--ink)]">
                {a.paymentNote}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Issued {new Date().toLocaleString()} · Thank you for choosing{" "}
          {data.brand}.
        </p>
      </article>
    </div>
  );
}

export default Receipt;
