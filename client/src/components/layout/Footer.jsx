import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-[var(--brand-deep)] text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-semibold">DentalCare</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            A neighborhood dental clinic focused on gentle treatment, clear
            communication, and healthy smiles for life.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Visit
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              12 Clinic Avenue, Lahore
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="shrink-0" />
              +92 300 1234567
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="shrink-0" />
              hello@dentalcare.clinic
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Hours
          </h3>
          <p className="mt-4 text-sm text-white/80">Mon – Sat · 9:00 AM – 8:00 PM</p>
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
        © {new Date().getFullYear()} DentalCare Clinic. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
