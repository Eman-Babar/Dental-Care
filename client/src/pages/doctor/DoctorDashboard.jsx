function DoctorDashboard() {
  const appointments = [
    {
      patient: "Ali Khan",
      service: "Dental Cleaning",
      date: "25 July 2026",
      status: "Pending",
    },
    {
      patient: "Sara Ahmed",
      service: "Root Canal Treatment",
      date: "28 July 2026",
      status: "Confirmed",
    },
    {
      patient: "Usman Ali",
      service: "Teeth Whitening",
      date: "02 August 2026",
      status: "Pending",
    },
  ];

  return (
    <div className="page-shell min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="border-b border-[var(--line)] pb-8">
          <p className="text-sm font-medium text-[var(--brand)]">Doctor portal</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[var(--ink)]">
            Dr. Ahmed Ali
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Today&apos;s schedule and patient requests
          </p>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Your profile</h2>
          <div className="mt-4 grid gap-4 border border-[var(--line)] bg-[var(--surface)] p-6 sm:grid-cols-2">
            <p className="text-sm">
              <span className="text-[var(--muted)]">Specialization</span>
              <br />
              <span className="font-medium">Orthodontist</span>
            </p>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <br />
              <span className="font-medium">doctor@dentalcare.clinic</span>
            </p>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Experience</span>
              <br />
              <span className="font-medium">8 years</span>
            </p>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Clinic</span>
              <br />
              <span className="font-medium">DentalCare · Lahore</span>
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">
            Patient appointments
          </h2>
          <div className="mt-4 space-y-4">
            {appointments.map((appointment) => (
              <article
                key={`${appointment.patient}-${appointment.date}`}
                className="flex flex-col gap-4 border border-[var(--line)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    {appointment.patient}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {appointment.service} · {appointment.date}
                  </p>
                  <p
                    className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                      appointment.status === "Confirmed"
                        ? "text-[var(--ok)]"
                        : "text-[var(--warn)]"
                    }`}
                  >
                    {appointment.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary !px-4 !py-2 text-sm">
                    Accept
                  </button>
                  <button type="button" className="btn-secondary !px-4 !py-2 text-sm">
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default DoctorDashboard;
