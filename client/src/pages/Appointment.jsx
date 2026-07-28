import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/layout/Footer";

function Appointment() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role === "PATIENT") {
      navigate("/patient", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const goBook = () => {
    if (isAuthenticated && user?.role === "PATIENT") {
      navigate("/patient");
      return;
    }
    navigate("/register");
  };

  return (
    <div className="page-shell">
      <section className="section-pad">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-semibold text-[var(--ink)] md:text-5xl">
            Book your dental visit
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
            Create a patient account (or sign in), then manage bookings from your
            dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={goBook} className="btn-primary">
              {isAuthenticated && user?.role === "PATIENT"
                ? "Go to my dashboard"
                : "Register & open dashboard"}
            </button>
            <Link to="/login" className="btn-secondary">
              Already registered? Sign in
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Appointment;
