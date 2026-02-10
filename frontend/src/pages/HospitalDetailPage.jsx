import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Phone, Star, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { hospitalApi } from '../api/hospitalApi';
import { formatDate, calculateUtilization, getPercentageColor } from '../utils/formatters';
import { BED_TYPE_LABELS } from '../utils/constants';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import BedChip from '../components/common/BedChip';

const HospitalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHospitalDetails();
    }, [id]);

    const fetchHospitalDetails = async () => {
        setLoading(true);
        try {
            const data = await hospitalApi.getHospital(id);
            setHospital(data.hospital);
        } catch (error) {
            console.error('Fetch hospital error:', error);
            toast.error('Failed to load hospital details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <LoadingSkeleton type="card" count={3} />
                </div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Hospital Not Found
                        </h2>
                        <Link to="/search" className="btn-primary inline-flex items-center space-x-2">
                            <span>Back to Search</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 mb-6"
                >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {hospital.name}
                            </h1>
                            <div className="space-y-2 text-slate-600 dark:text-slate-400">
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{hospital.address}</span>
                                </div>
                                {hospital.phone && (
                                    <div className="flex items-center space-x-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{hospital.phone}</span>
                                    </div>
                                )}
                                {hospital.rating && (
                                    <div className="flex items-center space-x-2">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span>{hospital.rating.toFixed(1)} / 5.0</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/book/${hospital.hospital_id}`)}
                            className="btn-primary md:w-auto"
                        >
                            Book a Bed
                        </button>
                    </div>
                </motion.div>

                {/* Bed Availability Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                        Bed Availability
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hospital.beds?.map((bed) => {
                            const utilization = calculateUtilization(bed.available, bed.total);
                            const colorClass = getPercentageColor(utilization);

                            return (
                                <div key={bed.bed_type} className="card p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {BED_TYPE_LABELS[bed.bed_type] || bed.bed_type}
                                        </h3>
                                        <BedChip
                                            bedType={bed.bed_type}
                                            available={bed.available}
                                            total={bed.total}
                                            showLabel={false}
                                        />
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            <span>Occupied</span>
                                            <span>{Math.round(utilization)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${utilization > 80
                                                        ? 'bg-red-500'
                                                        : utilization > 50
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${utilization}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Updated {formatDate(bed.updated_at || hospital.updated_at)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Doctors on Duty */}
                {hospital.doctors && hospital.doctors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                    >
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                            Doctors on Duty
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {hospital.doctors.map((doctor) => (
                                <div key={doctor.doctor_id} className="card p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                        Dr. {doctor.name}
                                    </h3>
                                    <p className="text-sm text-primary mb-2 capitalize">
                                        {doctor.specialty}
                                    </p>
                                    {doctor.shift_start && doctor.shift_end && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Shift: {doctor.shift_start} - {doctor.shift_end}
                                        </p>
                                    )}
                                    {doctor.on_duty && (
                                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                            On Duty
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Location Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6"
                >
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                        Location
                    </h2>
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-400">
                            Coordinates: {hospital.latitude}, {hospital.longitude}
                        </p>
                        <a
                            href={`https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary inline-flex items-center space-x-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open in Google Maps</span>
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HospitalDetailPage;
