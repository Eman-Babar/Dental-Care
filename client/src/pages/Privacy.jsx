import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";

function Privacy() {
  return (
    <div className="page-shell">
      <Seo
        title="Privacy Policy"
        description="How DentalCare collects and protects patient information."
      />
      <section className="section-pad">
        <div className="mx-auto max-w-3xl prose-none">
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Last updated: July 2026
          </p>
          <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--muted)]">
            <p>
              DentalCare (“we”, “our”) respects your privacy. This policy explains
              what information we collect when you use our website and clinic
              services, and how we use it.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Information we collect
            </h2>
            <p>
              When you book an appointment or create an account, we may collect
              your name, email, phone number, and details about your dental
              concern. Account passwords are stored securely using hashing.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              How we use information
            </h2>
            <p>
              We use your information to schedule visits, send appointment
              confirmations and updates, improve clinic operations, and respond
              to your enquiries. We do not sell your personal data.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Sharing
            </h2>
            <p>
              Clinical staff may access appointment details to provide care.
              Email delivery may use trusted third-party SMTP providers. We only
              share what is needed for those purposes.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Contact
            </h2>
            <p>
              Questions about privacy? Reach us via the{" "}
              <Link to="/contact" className="text-[var(--brand)] underline">
                Contact
              </Link>{" "}
              page.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Privacy;
