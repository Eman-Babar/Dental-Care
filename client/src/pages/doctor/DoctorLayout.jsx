import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/doctor", label: "Overview", end: true },
  { to: "/doctor/requests", label: "Pending requests" },
  { to: "/doctor/upcoming", label: "Upcoming" },
  { to: "/doctor/completed", label: "Completed" },
  { to: "/doctor/patients", label: "My patients" },
  { to: "/doctor/reviews", label: "Reviews" },
  { to: "/doctor/profile", label: "My profile" },
];

function DoctorLayout() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Doctor portal"
      subtitle={`Dr. ${user?.name || "Dentist"}`}
      links={links}
    >
      <Outlet />
    </DashboardLayout>
  );
}

export default DoctorLayout;
