import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, Loader2, Phone, Ambulance } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useGeolocation from '../hooks/useGeolocation';
import { emergencyApi } from '../api/emergencyApi';
import { SEVERITY_LEVELS } from '../utils/constants';

const SOSPage = () => {
    const navigate = useNavigate();
    const { location, loading: geoLoading, getCurrentLocation } = useGeolocation();

    const [severity, setSeverity] = useState('critical');
    const [description, setDescription] = useState('');
    const [requestAmbulance, setRequestAmbulance] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!location) {
            toast.error('Please enable location access');
            getCurrentLocation();
            return;
        }

        setSubmitting(true);
        try {
            const response = await emergencyApi.createSOS({
                latitude: location.lat,
                longitude: location.lng,
                severity,
                description,
                request_ambulance: requestAmbulance,
            });

            toast.success('Emergency SOS sent! Finding nearest hospitals...');

            // Navigate to search with emergency flag
            navigate('/search', {
                state: {
                    emergency: true,
                    sosId: response.sos_id,
                    hospitals: response.matched_hospitals,
                },
            });
        } catch (error) {
            console.error('SOS error:', error);
            toast.error('Failed to send SOS. Please try again or call emergency services.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Warning Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-6 mb-6 border-l-4 border-red-500"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center pulse-ring">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Emergency SOS
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                For life-threatening emergencies
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>⚠️ Important:</strong> This feature is for medical emergencies only.
                            If you need immediate assistance, please call <strong>108</strong> (Ambulance)
                            or <strong>102</strong> (Emergency Medical Services).
                        </p>
                    </div>
                </motion.div>

                {/* SOS Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Your Location
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting...'}
                                    className="input flex-1"
                                    readOnly
                                />
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    disabled={geoLoading}
                                    className="btn-secondary flex items-center space-x-2"
                                >
                                    {geoLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <MapPin className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                We'll use this to find the nearest hospitals
                            </p>
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Emergency Severity *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.entries(SEVERITY_LEVELS).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSeverity(value)}
                                        className={`p-4 rounded-lg border-2 transition-smooth text-center ${severity === value
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-red-300'
                                            }`}
                                    >
                                        <p className={`font-semibold ${severity === value ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Brief Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input"
                                rows={4}
                                placeholder="Describe the emergency situation (optional)"
                            ></textarea>
                        </div>

                        {/* Ambulance Request */}
                        <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <input
                                type="checkbox"
                                id="ambulance"
                                checked={requestAmbulance}
                                onChange={(e) => setRequestAmbulance(e.target.checked)}
                                className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded"
                            />
                            <label htmlFor="ambulance" className="flex-1 cursor-pointer">
                                <div className="flex items-center space-x-2 mb-1">
                                    <Ambulance className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        Request Ambulance
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Alert nearby hospitals to send an ambulance to your location
                                </p>
                            </label>
                        </div>

                        {/* Emergency Contacts */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                                Emergency Hotlines
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <a
                                    href="tel:108"
                                    className="flex items-center space-x-2 text-primary hover:underline"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>108 - Ambulance</span>
                                </a>
                                <a
                                    href="tel:102"
                                    className="flex items-center space-x-2 text-primary hover:underline"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>102 - Medical Emergency</span>
                                </a>
                                <a
                                    href="tel:112"
                                    className="flex items-center space-x-2 text-primary hover:underline"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>112 - Emergency Services</span>
                                </a>
                                <a
                                    href="tel:1066"
                                    className="flex items-center space-x-2 text-primary hover:underline"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>1066 - COVID Helpline</span>
                                </a>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || !location}
                            className="btn-accent w-full text-lg py-4 flex items-center justify-center space-x-2 pulse-ring"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Sending SOS...</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-6 h-6" />
                                    <span>🚨 Send Emergency SOS</span>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default SOSPage;
