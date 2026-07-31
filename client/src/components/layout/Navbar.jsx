import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { dashboardPathForRole } from "../../utils/storage";
import { useSiteContent } from "../../hooks/useSiteContent";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctors" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { get } = useSiteContent();
  const phone = get("contact.phone", "+92 300 1234567");
  const brand = get("home.brand", "DentalCare");
  const logoUrl = get("brand.logo_url", "");

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(243,248,247,0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--brand-deep)] sm:text-2xl"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-cover sm:h-9 sm:w-9"
            />
          ) : null}
          {brand}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[var(--brand)]"
                    : "text-[var(--muted)] hover:text-[var(--brand-deep)]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="hidden items-center gap-2 text-sm font-medium text-[var(--brand-deep)] xl:flex"
          >
            <Phone size={16} />
            {phone}
          </a>
          {isAuthenticated && user ? (
            <Link
              to={dashboardPathForRole(user.role)}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-secondary !px-4 !py-2 text-sm"
              >
                Sign in
              </Link>
              <Link
                to="/appointment"
                className="btn-primary !px-4 !py-2 text-sm"
              >
                Book visit
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2.5 text-[var(--brand-deep)] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-5 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-[var(--mist)] text-[var(--brand-deep)]"
                      : "text-[var(--ink)]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--brand-deep)]"
              onClick={() => setOpen(false)}
            >
              <Phone size={16} />
              {phone}
            </a>

            {isAuthenticated && user ? (
              <Link
                to={dashboardPathForRole(user.role)}
                onClick={() => setOpen(false)}
                className="btn-primary mt-2 text-center"
              >
                Dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="btn-secondary text-center !px-3 !py-2.5 text-sm"
                >
                  Sign in
                </Link>
                <Link
                  to="/appointment"
                  onClick={() => setOpen(false)}
                  className="btn-primary text-center !px-3 !py-2.5 text-sm"
                >
                  Book visit
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
