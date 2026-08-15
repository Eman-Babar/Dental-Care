import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useSiteContent } from "../hooks/useSiteContent";

function QueueDisplay() {
  const [params] = useSearchParams();
  const doctorId = params.get("doctorId") || "";
  const { get } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const [data, setData] = useState({ nowServing: [], waiting: [], waitingCount: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () => {
      api
        .get("/queue/display", {
          params: doctorId ? { doctorId } : undefined,
        })
        .then(({ data: res }) => {
          if (!alive) return;
          setData(res);
          setError("");
        })
        .catch(() => {
          if (alive) setError("Could not load queue");
        });
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [doctorId]);

  const now = data.nowServing?.[0];

  return (
    <div className="min-h-screen bg-[#064e4f] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">{brand}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Now serving
        </h1>

        {error ? <p className="mt-8 text-lg text-red-200">{error}</p> : null}

        <div className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur">
          {now ? (
            <>
              <p className="font-display text-7xl font-semibold sm:text-8xl">
                {now.tokenLabel}
              </p>
              <p className="mt-4 text-2xl">{now.patientName}</p>
              <p className="mt-2 text-lg text-white/75">
                {now.doctor?.name ? `Dr. ${now.doctor.name}` : "Clinic"}
                {now.service?.title ? ` · ${now.service.title}` : ""}
              </p>
            </>
          ) : (
            <p className="font-display text-3xl text-white/80">
              Waiting for next patient…
            </p>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white/80">
            Waiting ({data.waitingCount || 0})
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {(data.waiting || []).slice(0, 12).map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"
              >
                <p className="font-display text-2xl font-semibold">{t.tokenLabel}</p>
                <p className="text-sm text-white/75">{t.patientName}</p>
              </div>
            ))}
            {!data.waiting?.length ? (
              <p className="text-white/60">No one waiting</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueueDisplay;
