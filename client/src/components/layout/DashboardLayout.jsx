import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function LinkLabel({ label, badge }) {
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{label}</span>
      {badge > 0 ? (
        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--brand-deep)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </span>
  );
}

function DashboardLayout({ title, subtitle, links, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page-shell min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-[var(--surface)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--line)] px-5 py-6">
          <p className="font-display text-2xl font-semibold text-[var(--brand-deep)]">
            DentalCare
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{title}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--mist)] text-[var(--brand-deep)]"
                    : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                }`
              }
            >
              <LinkLabel label={link.label} badge={link.badge} />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--line)] p-4">
          <p className="truncate text-sm font-medium text-[var(--ink)]">
            {user?.name}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--paper)]"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[var(--line)] bg-[rgba(243,248,247,0.95)] px-3 py-3 backdrop-blur sm:px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-[var(--brand-deep)] lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold text-[var(--ink)] sm:text-xl md:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden truncate text-sm text-[var(--muted)] sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary shrink-0 !px-3 !py-2 text-sm lg:hidden"
          >
            <span className="hidden sm:inline">Sign out</span>
            <LogOut size={16} className="sm:hidden" />
          </button>
        </header>

        {open && (
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto border-b border-[var(--line)] bg-[var(--surface)] p-3 lg:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mb-1 block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-[var(--mist)] text-[var(--brand-deep)]"
                      : "text-[var(--muted)]"
                  }`
                }
              >
                <LinkLabel label={link.label} badge={link.badge} />
              </NavLink>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-x-hidden px-3 py-5 sm:px-4 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
