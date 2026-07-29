import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/appointments", label: "Appointments" },
  { to: "/admin/doctors", label: "Doctors" },
  { to: "/admin/patients", label: "Patients" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/content", label: "Site content" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/audit-logs", label: "Audit logs" },
];

function AdminLayout() {
  return (
    <DashboardLayout
      title="Admin panel"
      subtitle="Manage the DentalCare clinic"
      links={links}
    >
      <Outlet />
    </DashboardLayout>
  );
}

export default AdminLayout;
