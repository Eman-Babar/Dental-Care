import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Services from "./pages/Services";
import About from "./pages/About";
import Navbar from "./components/layout/Navbar";
import Appointment from "./pages/Appointment";
import Doctors from "./pages/Doctors";
import Contact from "./pages/Contact";
import Faq from "./pages/Faq";
import ServiceDetail from "./pages/ServiceDetail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PatientLayout from "./pages/patient/PatientLayout";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientBook from "./pages/patient/PatientBook";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientReviews from "./pages/patient/PatientReviews";
import PatientChat from "./pages/patient/PatientChat";
import DoctorLayout from "./pages/doctor/DoctorLayout";
import DoctorOverview from "./pages/doctor/DoctorOverview";
import DoctorRequests from "./pages/doctor/DoctorRequests";
import DoctorUpcoming from "./pages/doctor/DoctorUpcoming";
import DoctorCompleted from "./pages/doctor/DoctorCompleted";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorReviews from "./pages/doctor/DoctorReviews";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminServices from "./pages/admin/AdminServices";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminContent from "./pages/admin/AdminContent";
import Receipt from "./pages/Receipt";
import PaymentSuccess from "./pages/PaymentSuccess";
import { useAuth } from "./context/AuthContext";
import { dashboardPathForRole } from "./utils/storage";
import Loader from "./components/common/Loader";
import ChatBot from "./components/common/ChatBot";
import MaintenanceBanner from "./components/common/MaintenanceBanner";

const HIDE_NAV = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/patient",
  "/doctor",
  "/admin",
  "/receipt",
  "/payment",
];

function App() {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  const hideNavbar = HIDE_NAV.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  if (
    loading &&
    (location.pathname === "/register" ||
      location.pathname === "/login" ||
      location.pathname === "/forgot-password" ||
      location.pathname === "/reset-password")
  ) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {!hideNavbar && <MaintenanceBanner />}
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              <Navigate to={dashboardPathForRole(user.role)} replace />
            ) : (
              <Home />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register-doctor" element={<Navigate to="/login" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/receipt/:id"
          element={
            <ProtectedRoute roles={["PATIENT", "ADMIN"]}>
              <Receipt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute roles={["PATIENT", "ADMIN"]}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient"
          element={
            <ProtectedRoute roles={["PATIENT"]}>
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientAppointments />} />
          <Route path="book" element={<PatientBook />} />
          <Route path="chat" element={<PatientChat />} />
          <Route path="reviews" element={<PatientReviews />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        <Route
          path="/doctor"
          element={
            <ProtectedRoute roles={["DOCTOR"]}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorOverview />} />
          <Route path="requests" element={<DoctorRequests />} />
          <Route path="upcoming" element={<DoctorUpcoming />} />
          <Route path="completed" element={<DoctorCompleted />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="reviews" element={<DoctorReviews />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        <Route path="/patient-dashboard" element={<Navigate to="/patient" replace />} />
        <Route path="/doctor-dashboard" element={<Navigate to="/doctor" replace />} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/patient/dashboard" element={<Navigate to="/patient" replace />} />
      </Routes>
      {!hideNavbar && <ChatBot />}
    </>
  );
}

export default App;
