import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";

function Terms() {
  return (
    <div className="page-shell">
      <Seo
        title="Terms of Use"
        description="Terms and conditions for using the DentalCare website and booking services."
      />
      <section className="section-pad">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            Terms of Use
          </h1>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Last updated: July 2026
          </p>
          <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--muted)]">
            <p>
              By using the DentalCare website and booking tools, you agree to
              these terms. Please read them carefully.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Appointments
            </h2>
            <p>
              Submitting a booking request does not guarantee a confirmed slot
              until the clinic or assigned doctor approves it. Please arrive on
              time for confirmed visits and notify us if you need to cancel.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Medical information
            </h2>
            <p>
              Content on this website is for general information and does not
              replace a clinical examination. Treatment plans are confirmed in
              person by a licensed dentist.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Accounts
            </h2>
            <p>
              You are responsible for keeping login credentials secure. Do not
              share your password. Misuse of the platform may result in account
              suspension.
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              Contact
            </h2>
            <p>
              For questions about these terms, visit our{" "}
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

export default Terms;
