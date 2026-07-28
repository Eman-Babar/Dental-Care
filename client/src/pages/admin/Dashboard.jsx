import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const fallbackServices = [
  { id: 1, title: 'Routine Teeth Cleaning' },
  { id: 2, title: 'Root Canal Therapy' },
  { id: 3, title: 'Dental Braces & Orthodontics' },
];

const statusClasses = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const Dashboard = () => {
  const { user, logout, isAdmin, isDentist, isPatient } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState(fallbackServices);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    appointmentDate: '',
    appointmentTime: '',
    serviceId: '',
    message: '',
  });

  const stats = useMemo(() => {
    const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length;
    const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length;
    const cancelledCount = appointments.filter((appointment) => appointment.status === 'cancelled').length;

    return { pendingCount, confirmedCount, cancelledCount };
  }, [appointments]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const servicesResponse = await api.get('/services').catch(() => ({ data: { services: fallbackServices } }));
      const appointmentsResponse = await api.get(isPatient ? '/appointments/mine' : '/appointments').catch((err) => {
        console.error('Failed to load appointments:', err);
        return { data: { appointments: [] } };
      });

      const serviceList = servicesResponse.data?.services?.length ? servicesResponse.data.services : fallbackServices;
      setServices(serviceList);
      setAppointments(appointmentsResponse.data?.appointments || []);
    } catch (err) {
      console.error('Dashboard data load failed:', err);
      setError('Could not load dashboard data right now.');
    } finally {
      setLoading(false);
    }
  }, [isPatient, user]);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      patientName: user.name || prev.patientName,
      email: user.email || prev.email,
    }));

    fetchDashboardData();
  }, [fetchDashboardData, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = { ...formData, serviceId: parseInt(formData.serviceId, 10) };
      const response = await api.post('/appointments', payload);

      if (response.status === 201) {
        setSuccess('Your appointment request has been submitted and sent to the dental team.');
        setFormData({
          patientName: user?.name || '',
          email: user?.email || '',
          phone: '',
          appointmentDate: '',
          appointmentTime: '',
          serviceId: '',
          message: '',
        });
        await fetchDashboardData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setSuccess(`Appointment ${status === 'confirmed' ? 'approved' : 'rejected'} successfully.`);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update appointment status.');
    }
  };

  const renderPatientView = () => (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Client dashboard</h2>
              <p className="text-sm text-slate-500">Book a new appointment and review your previous visits.</p>
            </div>
          </div>

          {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
                <input name="patientName" value={formData.patientName} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Service</label>
                <select name="serviceId" value={formData.serviceId} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
                <select name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="">Select a time</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
              <textarea name="message" rows="3" value={formData.message} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="Share symptoms, concerns, or anything the clinic should know." />
            </div>

            <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              {submitting ? 'Submitting request...' : 'Request appointment'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-indigo-600 to-cyan-500 p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" />
            <h2 className="text-xl font-semibold">What happens next?</h2>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-indigo-50">
            <li>• Your request is sent to the doctors dashboard for review.</li>
            <li>• The team checks your details and updates the appointment status.</li>
            <li>• You can follow every change in your appointment history below.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Your previous appointments</h2>
            <p className="text-sm text-slate-500">Track every booking request and its current status.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{appointments.length} total</div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            You do not have any appointments yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="align-top">
                    <td className="px-3 py-3 text-slate-700">{appointment.service?.title || 'Unknown service'}</td>
                    <td className="px-3 py-3 text-slate-700">{appointment.appointmentDate}</td>
                    <td className="px-3 py-3 text-slate-700">{appointment.appointmentTime}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[appointment.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderDoctorView = () => (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Doctor dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Review client requests, view details, and approve or reject appointments.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <p className="font-semibold">Pending</p>
              <p className="mt-1 text-xl font-bold">{stats.pendingCount}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <p className="font-semibold">Approved</p>
              <p className="mt-1 text-xl font-bold">{stats.confirmedCount}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-semibold">Rejected</p>
              <p className="mt-1 text-xl font-bold">{stats.cancelledCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Incoming appointment requests</h2>
            <p className="text-sm text-slate-500">Approve or reject each booking as soon as you review it.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No appointments have been requested yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-3 font-medium">Patient</th>
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{appointment.patientName}</p>
                      <p className="text-xs text-slate-500">{appointment.email}</p>
                      <p className="text-xs text-slate-500">{appointment.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{appointment.service?.title || 'Unknown service'}</td>
                    <td className="px-3 py-3 text-slate-700">{appointment.appointmentDate}</td>
                    <td className="px-3 py-3 text-slate-700">{appointment.appointmentTime}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[appointment.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleStatusChange(appointment.id, 'confirmed')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => handleStatusChange(appointment.id, 'cancelled')} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Admin dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Manage clinic appointments from one place and keep the booking workflow moving.</p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-700">
            <p className="font-semibold">Clinic overview</p>
            <p className="mt-1">{appointments.length} total requests</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Clock3 className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">All appointments</h2>
            <p className="text-sm text-slate-500">Each request includes client contact details so administrators can review and act fast.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No appointments are available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-3 font-medium">Patient</th>
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{appointment.patientName}</p>
                      <p className="text-xs text-slate-500">{appointment.email}</p>
                      <p className="text-xs text-slate-500">{appointment.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{appointment.service?.title || 'Unknown service'}</td>
                    <td className="px-3 py-3 text-slate-700">{appointment.appointmentDate}</td>
                    <td className="px-3 py-3 text-slate-700">{appointment.appointmentTime}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[appointment.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleStatusChange(appointment.id, 'confirmed')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => handleStatusChange(appointment.id, 'cancelled')} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xl font-semibold text-indigo-700">Dental Clinic Care</p>
            <p className="text-sm text-slate-500">Role-based workspace for patients, doctors, and admins</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {user?.role || 'USER'}
            </span>
            <button
              onClick={logout}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Dashboard</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, {user?.name || 'there'}.</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                {isPatient && 'Book new appointments and review your previous visits from one place.'}
                {isDentist && 'Review incoming appointment requests, view client details, and approve or reject requests.'}
                {isAdmin && 'Manage the full clinic workflow, review appointments, and keep requests moving.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-700">
              <p className="font-semibold">Current role</p>
              <p className="mt-1">{user?.role}</p>
            </div>
          </div>
        </div>

        {isPatient && renderPatientView()}
        {isDentist && renderDoctorView()}
        {isAdmin && renderAdminView()}
      </main>
    </div>
  );
};

export default Dashboard;
