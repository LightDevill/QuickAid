import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, AlertCircle, FileText, Hospital, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import useBookingStore from '../stores/bookingStore';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatTime } from '../utils/formatters';
import HospitalAdminPanel from '../components/hospital/HospitalAdminPanel';

const DashboardPage = () => {
    const { user } = useAuth();
    const { activeBooking } = useBookingStore();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const quickActions = [
        {
            icon: Search,
            title: 'Find Beds',
            description: 'Search for available hospital beds',
            color: 'bg-blue-500',
            link: '/search',
        },
        {
            icon: AlertCircle,
            title: 'Emergency SOS',
            description: 'Quick emergency hospital matching',
            color: 'bg-red-500',
            link: '/sos',
        },
        {
            icon: FileText,
            title: 'My Bookings',
            description: 'View your booking history',
            color: 'bg-green-500',
            link: '/my-bookings',
        },
        {
            icon: Hospital,
            title: 'Nearby Hospitals',
            description: 'Find hospitals near you',
            color: 'bg-purple-500',
            link: '/search',
        },
    ];

    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchActivity = async () => {
            if (user?.role !== 'citizen') return; // Only citizen has this specific activity view
            try {
                const { bookingApi } = await import('../api/bookingApi');
                const response = await bookingApi.getMyBookings();

                // Map bookings to activity
                const bookings = response.bookings || [];
                const activities = bookings.slice(0, 5).map(b => ({
                    id: b.booking_id,
                    title: `Booking at ${b.hospital_name}`,
                    description: `Status: ${b.status} • ${b.bed_type}`,
                    timestamp: b.created_at
                }));
                setRecentActivity(activities);
            } catch (error) {
                console.error('Failed to fetch activity', error);
            }
        };

        if (user) {
            fetchActivity();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Hello, {user?.name || 'User'} 👋
                    </h1>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>
                            {currentTime.toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                        <span>•</span>
                        <span>{currentTime.toLocaleTimeString('en-IN')}</span>
                    </div>
                </motion.div>

                {/* Role-Based Content */}
                {user?.role === 'hospital_admin' ? (
                    <HospitalAdminPanel />
                ) : (
                    <>
                        {/* Active Booking Card */}
                        {activeBooking && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="card p-6 mb-8 border-l-4 border-primary"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                                            Active Booking
                                        </h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {activeBooking.hospital_name}
                                        </p>
                                    </div>
                                    <StatusBadge status={activeBooking.status} />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bed Type</p>
                                        <p className="font-medium text-slate-900 dark:text-white capitalize">
                                            {activeBooking.bed_type}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Patient</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {activeBooking.patient_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Booking Time</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {formatTime(activeBooking.created_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Booking ID</p>
                                        <p className="font-medium text-slate-900 dark:text-white font-mono text-sm">
                                            {activeBooking.booking_id?.slice(0, 8)}...
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to={`/booking-status/${activeBooking.booking_id}`}
                                    className="btn-primary text-sm inline-flex items-center space-x-2"
                                >
                                    <span>View Details</span>
                                    <Activity className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        )}

                        {/* Quick Actions */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {quickActions.map((action, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                        <Link
                                            to={action.link}
                                            className="card p-6 hover:shadow-lg transition-smooth group"
                                        >
                                            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                                                <action.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                                {action.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {action.description}
                                            </p>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                Recent Activity
                            </h2>
                            <div className="card p-6">
                                {recentActivity.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentActivity.map((activity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                                            >
                                                <div className="flex items-center space-x-4 flex-1">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                        <Activity className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                                            {activity.title}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                                            {activity.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2 shrink-0">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDate(activity.timestamp)}
                                                    </span>
                                                    <Link
                                                        to={`/booking-status/${activity.id}`}
                                                        className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-600 dark:text-slate-400">
                                            No recent activity yet
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                            Your booking history will appear here
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
