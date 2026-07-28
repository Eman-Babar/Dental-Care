import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/patient", label: "Appointments", end: true },
  { to: "/patient/book", label: "Book appointment" },
  { to: "/patient/chat", label: "Assistant" },
  { to: "/patient/reviews", label: "Reviews" },
  { to: "/patient/profile", label: "My profile" },
];

function PatientLayout() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Patient portal"
      subtitle={`Welcome, ${user?.name || "Patient"}`}
      links={links}
    >
      <Outlet />
    </DashboardLayout>
  );
}

export default PatientLayout;
