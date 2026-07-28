import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Clock, ClipboardList, CheckCircle } from 'lucide-react';

const Appointment = () => {
  const location = useLocation();
  const passedServiceId = location.state?.selectedServiceId || '';

  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    appointmentDate: '',
    appointmentTime: '',
    serviceId: passedServiceId,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fallback services in case DB isn't seeded yet
  const fallbackServices = [
    { id: 1, title: "Routine Teeth Cleaning" },
    { id: 2, title: "Root Canal Therapy" },
    { id: 3, title: "Dental Braces & Orthodontics" }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        if (response.data && response.data.services && response.data.services.length > 0) {
          setServices(response.data.services);
        } else {
          setServices(fallbackServices);
        }
      } catch (error) {
        console.error('Failed to load services:', error);
        setServices(fallbackServices);
      }
    };

    fetchServices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        serviceId: parseInt(formData.serviceId, 10),
      };

      const response = await api.post('/appointments', payload);
      if (response.status === 201) {
        setSuccess(true);
        setFormData({
          patientName: '',
          email: '',
          phone: '',
          appointmentDate: '',
          appointmentTime: '',
          serviceId: '',
          message: '',
        });
      }
    } catch (error) {
      console.error('Booking appointment error:', error);
      setError(
        error.response?.data?.message ||
          'Failed to book appointment. Please check connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto rounded-3xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Form Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 py-10 px-8 text-center text-white">
          <Calendar className="mx-auto h-12 w-12 text-indigo-100 mb-2" />
          <h1 className="text-3xl font-extrabold tracking-tight">Book Your Visit</h1>
          <p className="mt-2 text-indigo-100 max-w-md mx-auto text-sm">
            Fill out the form below to request your visit date and time slot. Our medical team will verify and email confirmation.
          </p>
        </div>

        {/* Success screen */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900">Appointment Requested Successfully!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for scheduling your dental visit. We have sent a confirmation details email to you. Our staff will coordinate status updates shortly.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              Book Another Visit
            </button>
          </div>
        ) : (
          /* Form fields */
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="patientName"
                  required
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="johndoe@example.com"
                  className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                />
              </div>

              {/* Service selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Select Treatment Service
                </label>
                <select
                  name="serviceId"
                  required
                  value={formData.serviceId}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                >
                  <option value="">-- Choose Dental Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Preferred Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="appointmentDate"
                    required
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                  />
                </div>
              </div>

              {/* Time selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  name="appointmentTime"
                  required
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                >
                  <option value="">-- Select Time Slot --</option>
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

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Symptoms / Medical History Note (Optional)
              </label>
              <textarea
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                placeholder="Let us know if you are experiencing tooth pain, swelling, or have specific medical request details..."
                className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-150 ease-in-out cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-white"></span>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <ClipboardList size={20} /> Request Appointment Slot
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default Appointment;
