import { Link } from "react-router-dom";
import { CalendarPlus } from "lucide-react";

function PatientDashboard() {
  const appointments = [
    {
      service: "Dental Cleaning",
      doctor: "Dr. Ahmed Ali",
      date: "25 July 2026",
      status: "Confirmed",
    },
    {
      service: "Root Canal Treatment",
      doctor: "Dr. Sarah Khan",
      date: "30 July 2026",
      status: "Pending",
    },
  ];

  return (
    <div className="page-shell min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">Patient portal</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[var(--ink)]">
              Welcome back
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              Your DentalCare appointments and profile
            </p>
          </div>
          <Link to="/appointment" className="btn-primary inline-flex gap-2">
            <CalendarPlus size={18} />
            New appointment
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
            Profile
          </h2>
          <div className="mt-4 grid gap-4 border border-[var(--line)] bg-[var(--surface)] p-6 sm:grid-cols-2">
            <p className="text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <br />
              <span className="font-medium">Ali Khan</span>
            </p>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <br />
              <span className="font-medium">ali@gmail.com</span>
            </p>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Phone</span>
              <br />
              <span className="font-medium">0300-1234567</span>
            </p>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Age</span>
              <br />
              <span className="font-medium">25</span>
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
            My appointments
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {appointments.map((appointment) => (
              <article
                key={`${appointment.service}-${appointment.date}`}
                className="border border-[var(--line)] bg-[var(--surface)] p-6"
              >
                <h3 className="font-display text-xl font-semibold">
                  {appointment.service}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {appointment.doctor}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{appointment.date}</p>
                <span
                  className={`mt-4 inline-block text-xs font-semibold uppercase tracking-wide ${
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

export default PatientDashboard;
