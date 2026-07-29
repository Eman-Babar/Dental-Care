import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useSiteContent } from "../../hooks/useSiteContent";

function Footer() {
  const { get } = useSiteContent();
  const address = get("contact.address", "12 Clinic Avenue, Lahore");
  const phone = get("contact.phone", "+92 300 1234567");
  const email = get("contact.email", "hello@dentalcare.com");
  const hours = get("contact.hours", "Mon – Sat · 9:00 AM – 5:00 PM");
  const brand = get("home.brand", "DentalCare");

  return (
    <footer className="bg-[var(--brand-deep)] text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-semibold">{brand}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            A neighborhood dental clinic focused on gentle treatment, clear
            communication, and healthy smiles for life.
          </p>
          <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/75">
            <Link to="/about" className="hover:text-white">
              About
            </Link>
            <Link to="/services" className="hover:text-white">
              Services
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Visit
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              {address}
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="shrink-0" />
              {phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="shrink-0" />
              {email}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Hours
          </h3>
          <p className="mt-4 text-sm text-white/80">{hours}</p>
          <p className="mt-1 text-sm text-white/80">Sunday · Emergency only</p>
          <Link
            to="/appointment"
            className="btn-primary mt-6 w-full !bg-white !text-[var(--brand-deep)] sm:w-auto"
          >
            Book a visit
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {brand} Clinic. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
