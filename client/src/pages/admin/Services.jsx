import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Check, ClipboardList, ShieldCheck } from 'lucide-react';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback services in case DB isn't populated/migrated yet
  const fallbackServices = [
    {
      id: 1,
      title: "Routine Teeth Cleaning",
      description: "Professional plaque removal, scaling, and polishing to maintain oral health and prevent decay.",
      image: ""
    },
    {
      id: 2,
      title: "Root Canal Therapy",
      description: "Endodontic treatment to repair and save a badly decayed or infected tooth, restoring function painlessly.",
      image: ""
    },
    {
      id: 3,
      title: "Dental Braces & Orthodontics",
      description: "Corrective alignment systems including traditional metal braces and modern clear aligners for all ages.",
      image: ""
    }
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
        console.error('Error fetching services:', error);
        setServices(fallbackServices);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="bg-white">
      {/* 1. Header Banner */}
      <section className="bg-slate-900 text-white py-16 lg:py-20 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Our Dental Services
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-slate-300">
            Professional oral healthcare treatments custom-tailored to protect, restore, and beautify your smile.
          </p>
        </div>
      </section>

      {/* 2. Services Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-100 transition duration-150 flex flex-col justify-between"
              >
                {/* Header preview box */}
                <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 flex items-center justify-between border-b border-gray-100/50">
                  <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-xs text-indigo-600 font-bold">
                    <ClipboardList size={22} />
                  </div>
                  <ShieldCheck size={18} className="text-indigo-400" />
                </div>

                {/* Body Content */}
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {service.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                      <Check size={14} className="text-green-500 font-black" /> Professional FDA-approved materials
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                      <Check size={14} className="text-green-500 font-black" /> Insured and finance plans eligible
                    </li>
                  </ul>
                </div>

                {/* Card Action footer */}
                <div className="p-6 pt-0">
                  <Link
                    to="/appointment"
                    state={{ selectedServiceId: service.id }}
                    className="block w-full text-center rounded-xl bg-indigo-50 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Select & Book Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Core Values Promo */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <h4 className="text-lg font-bold text-gray-950 mb-2">Preventive Focus</h4>
            <p className="text-sm text-gray-500">We work to prevent cavities and complications before they require expensive procedures.</p>
          </div>
          <div className="p-6">
            <h4 className="text-lg font-bold text-gray-950 mb-2">Painless Guarantee</h4>
            <p className="text-sm text-gray-500">We utilize modern numbing and sedative dentistry so you stay comfortable.</p>
          </div>
          <div className="p-6">
            <h4 className="text-lg font-bold text-gray-950 mb-2">Full Transparency</h4>
            <p className="text-sm text-gray-500">No hidden fees, no unnecessary therapies. You review and approve your path.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
