import React, { useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import MapCard from './components/MapCard';
import LogsAccordion from './components/LogsAccordion';
import LoadingSpinner from './components/LoadingSpinner';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: '',
  });
  const [tripData, setTripData] = useState(null);
  
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    if (name === 'current_cycle_used') {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Must be a number';
      if (num < 0 || num > 70) return 'Between 0 and 70 hours';
    }
    if (['current_location', 'pickup_location', 'dropoff_location'].includes(name)) {
      if (!value.trim()) return 'Required field';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please resolve validation errors.');
      return;
    }
    setLoading(true);
    try {
      console.log("API URL:", `${API_URL}/api/plan-trip/`);
      const response = await axios.post(`${API_URL}/api/plan-trip/`, {
        ...form,
        current_cycle_used: parseFloat(form.current_cycle_used),
      });
      console.log("API Response:", response.data);
      setTripData(response.data);
      if (response.data.flag_limit) {
        toast.error('HOS limit exceeded. Please adjust your cycle time or route parameters.');
      } else {
        toast.success('Route parameters calculated successfully!');
      }
      
    } catch (err) {
      const msg = err.response?.data?.error || 'The server is currently unreachable. Please try again later.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 bg-gradient-to-tr from-slate-50 via-zinc-50 to-indigo-50/30">
      <Toaster position="top-right" toastOptions={{ className: 'rounded-xl shadow-lg border border-slate-100' }} />
      
      {/* Dynamic Header */}
      <header className="border-b border-slate-200/60 bg-white/60 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="container mx-auto px-6 py-4 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">LogiTrack ELD Planner</h1>
              <p className="text-xs font-medium text-slate-500">Commercial Route Intelligence Planner</p>
            </div>
          </div>
          {/* <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LogiTrack ELD Compliant (70hr / 8day)
          </div> */}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="premium-card p-6 bg-white">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Routing Directives</h2>
                <p className="text-xs text-slate-500 mt-0.5">Input your target points and current dispatch metrics.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Origin Location</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="current_location"
                      placeholder="e.g. Chicago, IL"
                      className={`input-premium pl-4 ${errors.current_location ? 'border-red-400 focus:ring-red-200' : ''}`}
                      value={form.current_location}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.current_location && <span className="text-red-500 text-xs mt-1.5 font-medium">{errors.current_location}</span>}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pickup Terminal</span>
                  </label>
                  <div className="relative">
                  <input
                    type="text"
                    name="pickup_location"
                    placeholder="e.g. St. Louis, MO"
                    className={`input-premium ${errors.pickup_location ? 'border-red-400 focus:ring-red-200' : ''}`}
                    value={form.pickup_location}
                    onChange={handleChange}
                  />
                  </div>
                  {errors.pickup_location && <span className="text-red-500 text-xs mt-1.5 font-medium">{errors.pickup_location}</span>}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Dropoff Terminal</span>
                  </label>
                  <div className="relative">
                  <input
                    type="text"
                    name="dropoff_location"
                    placeholder="e.g. Dallas, TX"
                    className={`input-premium ${errors.dropoff_location ? 'border-red-400 focus:ring-red-200' : ''}`}
                    value={form.dropoff_location}
                    onChange={handleChange}
                  />
                  </div>
                  {errors.dropoff_location && <span className="text-red-500 text-xs mt-1.5 font-medium">{errors.dropoff_location}</span>}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Cycle Time Expended (8 Days)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      name="current_cycle_used"
                      placeholder="0.0 - 70.0 hours"
                      className={`input-premium ${errors.current_cycle_used ? 'border-red-400 focus:ring-red-200' : ''}`}
                      value={form.current_cycle_used}
                      onChange={handleChange}
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">HRS</span>
                  </div>
                  {errors.current_cycle_used && <span className="text-red-500 text-xs mt-1.5 font-medium">{errors.current_cycle_used}</span>}
                </div>

                <button 
                  type="submit" 
                  className="btn border-0 w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium shadow-md shadow-indigo-200/80 transition-all duration-150 py-3.5 h-auto min-h-0 mt-2" 
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner /> : 'Optimize Dispatch Configuration'}
                </button>
              </form>
            </div>
            
            
          </div>

          {/* Visualization Data Column */}
          <div className="lg:col-span-8 space-y-8">
            {loading && (
              <div className="premium-card flex flex-col justify-center items-center h-96 bg-white">
                <div className="relative flex items-center justify-center">
                  <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-indigo-400 opacity-20"></div>
                  <span className="loading loading-spinner loading-lg text-indigo-600 relative"></span>
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-4 tracking-wide">Processing HOS Graph Segments...</p>
                <p className="text-xs text-slate-400 mt-1">Evaluating drive clocks against transit layout constraints</p>
              </div>
            )}
            
            {tripData && !loading && (
              <div className="transition-all duration-300">
                {!tripData.flag_limit ? (
                  <div className="space-y-8">
                    <MapCard 
                      geometry={tripData.route_geometry} 
                      waypoints={tripData.waypoints} 
                      totalDistance={tripData.total_distance_miles} 
                      stops={tripData.stops} 
                    />
                    <LogsAccordion logs={tripData.logs} form={form} />
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 mix-blend-multiply">
                    <div className="flex flex-col items-center text-center py-24 px-6">
                      <div className="h-16 w-16 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-4">
                        🗺️
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">HOS Limit Exceeded</h3>
                      <p className="text-sm text-slate-500 max-w-sm mt-1">
                        You have exceeded the maximum allowed driving hours (70/8d) for the current cycle.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          
            {!tripData && !loading && (
              <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 mix-blend-multiply">
                <div className="flex flex-col items-center text-center py-24 px-6">
                  <div className="h-16 w-16 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-4">🗺️</div>
                  <h3 className="text-lg font-bold text-slate-800">No active dispatch generated</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-1">Provide origin, terminal handoffs, and target clocks on the sidebar inputs to initialize mapping configurations.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;