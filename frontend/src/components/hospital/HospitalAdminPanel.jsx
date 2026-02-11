import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BedDouble, ClipboardList, Settings, TrendingUp, AlertCircle, Users, BarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalApi } from '../../api/hospitalApi';
import useAuth from '../../hooks/useAuth';
import BedAvailabilityManager from './BedAvailabilityManager';
import BookingRequestList from './BookingRequestList';
import StaffManagement from './StaffManagement';
import HospitalAnalytics from './HospitalAnalytics';

const HospitalAdminPanel = () => {
    const { user } = useAuth();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'beds', 'staff', 'analytics'

    useEffect(() => {
        if (user?.hospital_id) {
            fetchHospitalDetails();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchHospitalDetails = async () => {
        setLoading(true);
        try {
            const data = await hospitalApi.getHospital(user.hospital_id);
            setHospital(data.hospital);
        } catch (error) {
            console.error('Fetch hospital error:', error);
            toast.error('Failed to load hospital data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-slate-500 font-medium">Initializing Admin Panel...</p>
            </div>
        );
    }

    if (!user?.hospital_id || !hospital) {
        return (
            <div className="card p-12 text-center my-8 max-w-2xl mx-auto">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Hospital Not Found</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Your account is not associated with any hospital. Please contact system administration.
                </p>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Beds',
            value: hospital.beds?.reduce((acc, b) => acc + b.total, 0) || 0,
            icon: BedDouble,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Available Now',
            value: hospital.beds?.reduce((acc, b) => acc + b.available, 0) || 0,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            label: 'Active Staff',
            value: hospital.doctors?.filter(d => d.on_duty).length || 0,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {hospital.name} Admin Portal
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Manage your hospital's inventory and patient requests
                    </p>
                </div>
                <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                    {[
                        { id: 'bookings', label: 'Requests', icon: ClipboardList },
                        { id: 'beds', label: 'Inventory', icon: BedDouble },
                        { id: 'staff', label: 'Staff', icon: Users },
                        { id: 'analytics', label: 'Analytics', icon: BarChart },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden lg:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card p-5 flex items-center space-x-4"
                    >
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[400px]"
            >
                {activeTab === 'beds' && (
                    <BedAvailabilityManager
                        hospital={hospital}
                        onUpdate={fetchHospitalDetails}
                    />
                )}
                {activeTab === 'bookings' && (
                    <BookingRequestList
                        hospitalId={hospital.hospital_id}
                    />
                )}
                {activeTab === 'staff' && (
                    <StaffManagement
                        hospital={hospital}
                        onUpdate={fetchHospitalDetails}
                    />
                )}
                {activeTab === 'analytics' && (
                    <HospitalAnalytics
                        hospital={hospital}
                    />
                )}
            </motion.div>
        </div>
    );
};

export default HospitalAdminPanel;
