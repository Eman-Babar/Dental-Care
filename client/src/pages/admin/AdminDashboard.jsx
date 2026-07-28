import { Users, UserRound, CalendarDays, Stethoscope } from "lucide-react";

function AdminDashboard() {
  const stats = [
    { title: "Patients", value: "250", icon: Users },
    { title: "Dentists", value: "15", icon: UserRound },
    { title: "Appointments", value: "120", icon: CalendarDays },
    { title: "Services", value: "8", icon: Stethoscope },
  ];

  const appointments = [
    {
      patient: "Ali Khan",
      doctor: "Dr. Ahmed Ali",
      service: "Cleaning",
      status: "Confirmed",
    },
    {
      patient: "Sara Ahmed",
      doctor: "Dr. Sarah Khan",
      service: "Root Canal",
      status: "Pending",
    },
  ];

  return (
    <div className="page-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="border-b border-[var(--line)] pb-8">
          <p className="text-sm font-medium text-[var(--brand)]">Clinic admin</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[var(--ink)]">
            DentalCare overview
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Manage patients, doctors, and daily appointments
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <Icon size={20} className="text-[var(--brand)]" strokeWidth={1.75} />
                <p className="mt-4 text-sm text-[var(--muted)]">{stat.title}</p>
                <p className="mt-1 font-display text-3xl font-semibold text-[var(--ink)]">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">
            Recent appointments
          </h2>
          <div className="mt-4 space-y-3">
            {appointments.map((appointment) => (
              <article
                key={`${appointment.patient}-${appointment.service}`}
                className="flex flex-col gap-2 border border-[var(--line)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-[var(--ink)]">
                    {appointment.patient}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    {appointment.doctor} · {appointment.service}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    appointment.status === "Confirmed"
                      ? "text-[var(--ok)]"
                      : "text-[var(--warn)]"
                  }`}
                >
                  {appointment.status}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
