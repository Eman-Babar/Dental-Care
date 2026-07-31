import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function AdminLayout() {
  const [alerts, setAlerts] = useState({ pending: 0, paymentClaims: 0 });

  useEffect(() => {
    let alive = true;
    const load = () => {
      api
        .get("/admin/alerts")
        .then(({ data }) => {
          if (!alive) return;
          setAlerts({
            pending: data.pending || 0,
            paymentClaims: data.paymentClaims || 0,
          });
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const links = useMemo(
    () => [
      { to: "/admin", label: "Overview", end: true },
      {
        to: "/admin/appointments",
        label: "Appointments",
        badge: alerts.pending + alerts.paymentClaims,
      },
      { to: "/admin/doctors", label: "Doctors" },
      { to: "/admin/patients", label: "Patients" },
      { to: "/admin/services", label: "Services" },
      { to: "/admin/content", label: "Site content" },
      { to: "/admin/reviews", label: "Reviews" },
      { to: "/admin/audit-logs", label: "Audit logs" },
    ],
    [alerts]
  );

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
