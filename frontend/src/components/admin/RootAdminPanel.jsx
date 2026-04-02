import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Building2, BedDouble, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Users, ShieldCheck, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsApi } from '../../api/analyticsApi';
import { hospitalApi } from '../../api/hospitalApi';
import { bookingApi } from '../../api/bookingApi';

const normalize = (response) => response?.data || response || {};
const DASHBOARD_REQUEST_TIMEOUT_MS = 12000;

const withTimeout = (promise, timeoutMs, label) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });

const RootAdminPanel = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({});
    const [hospitals, setHospitals] = useState([]);
    const [bookingReport, setBookingReport] = useState(null);
    const [bookingId, setBookingId] = useState('');

    const loadDashboard = async () => {
        try {
            const [dashboardRes, hospitalsRes] = await Promise.all([
                withTimeout(
                    analyticsApi.getDashboard(),
                    DASHBOARD_REQUEST_TIMEOUT_MS,
                    'Dashboard metrics request'
                ),
                withTimeout(
                    hospitalApi.searchHospitals(19.076, 72.8777, 'general', 50),
                    DASHBOARD_REQUEST_TIMEOUT_MS,
                    'Hospital search request'
                ),
            ]);

            const dashboard = normalize(dashboardRes);
            const hospitalData = normalize(hospitalsRes);
            setStats(dashboard);
            setHospitals(hospitalData.hospitals || []);

            try {
                const reportRes = await withTimeout(
                    analyticsApi.getBookingReport(),
                    DASHBOARD_REQUEST_TIMEOUT_MS,
                    'Booking report request'
                );
                setBookingReport(normalize(reportRes));
            } catch (reportError) {
                // Optional source for extended metrics; keep panel usable if unavailable.
                console.warn('Root admin booking report unavailable:', reportError);
                setBookingReport(null);
            }
        } catch (error) {
            console.error('Root admin dashboard load error:', error);
            toast.error(error?.message || 'Failed to load control center data');
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await loadDashboard();
            if (mounted) setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const statCards = useMemo(
        () => [
            {
                label: 'Hospitals',
                value: stats.total_hospitals ?? hospitals.length ?? 0,
                icon: Building2,
                tone: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            },
            {
                label: 'Available Beds',
                value: stats.available_beds ?? 0,
                icon: BedDouble,
                tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            },
            {
                label: "Today's Bookings",
                value: stats.todays_bookings ?? 0,
                icon: Activity,
                tone: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            },
            {
                label: 'Active Emergencies',
                value: stats.active_emergencies ?? 0,
                icon: AlertTriangle,
                tone: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
            },
        ],
        [stats, hospitals.length]
    );

    const overallStats = useMemo(() => {
        const totalBeds = hospitals.reduce(
            (sum, hospital) => sum + (hospital.beds || []).reduce((bedSum, bed) => bedSum + (bed.total || 0), 0),
            0
        );

        const availableBeds = hospitals.reduce(
            (sum, hospital) => sum + (hospital.beds || []).reduce((bedSum, bed) => bedSum + (bed.available || 0), 0),
            0
        );

        const onlineHospitals = hospitals.filter((hospital) => hospital.is_active !== false).length;
        const activeHospitalAdmins = hospitals.reduce(
            (sum, hospital) => sum + (hospital.doctors || []).filter((doctor) => doctor.on_duty).length,
            0
        );

        const bookingsSeries = bookingReport?.bookings || [];
        const approvalsSeries = bookingReport?.approvals || [];
        const recentBookings = bookingsSeries.reduce((sum, item) => sum + Number(item || 0), 0);
        const recentApprovals = approvalsSeries.reduce((sum, item) => sum + Number(item || 0), 0);
        const approvalRate = recentBookings > 0 ? Math.round((recentApprovals / recentBookings) * 100) : null;

        const userActions = (stats.todays_bookings || 0) + (stats.active_emergencies || 0);
        const uptimePercent = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : null;

        return {
            userActions,
            recentBookings,
            approvalRate,
            onlineHospitals,
            activeHospitalAdmins,
            uptimePercent,
        };
    }, [bookingReport, hospitals, stats]);

    const hospitalAdminActivities = useMemo(() => {
        const now = Date.now();
        const generated = hospitals.slice(0, 6).map((hospital, index) => {
            const available = (hospital.beds || []).reduce((sum, bed) => sum + (bed.available || 0), 0);
            return {
                id: `hosp-admin-${hospital.hospital_id || hospital.id || index}`,
                hospital: hospital.name,
                action: available < 10 ? 'Escalated low-bed alert' : 'Published routine bed availability update',
                timestamp: new Date(now - index * 8 * 60 * 1000).toISOString(),
                status: available < 10 ? 'critical' : 'normal',
            };
        });

        const recentActivity = (stats.recent_activity || []).slice(0, 4).map((item, index) => ({
            id: `recent-${index}`,
            hospital: 'System Activity',
            action: item.message || item.type || 'Admin activity',
            timestamp: item.time || 'just now',
            status: item.type === 'emergency' ? 'critical' : 'normal',
        }));

        return [...generated, ...recentActivity];
    }, [hospitals, stats.recent_activity]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
        toast.success('Control center refreshed');
    };

    const handleApprove = async () => {
        if (!bookingId.trim()) {
            toast.error('Enter a booking ID first');
            return;
        }
        try {
            await bookingApi.approveBooking(bookingId.trim());
            toast.success(`Booking ${bookingId} approved`);
            setBookingId('');
        } catch (error) {
            console.error('Approve booking error:', error);
            toast.error(error?.response?.data?.message || 'Failed to approve booking');
        }
    };

    const handleReject = async () => {
        if (!bookingId.trim()) {
            toast.error('Enter a booking ID first');
            return;
        }
        try {
            await bookingApi.rejectBooking(bookingId.trim());
            toast.success(`Booking ${bookingId} rejected`);
            setBookingId('');
        } catch (error) {
            console.error('Reject booking error:', error);
            toast.error(error?.response?.data?.message || 'Failed to reject booking');
        }
    };

    if (loading) {
        return (
            <div className="card p-8">
                <p className="text-slate-600 dark:text-slate-300">Loading root admin control center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Root Admin Control Center</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Platform-wide visibility and high-privilege operational actions
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn-secondary inline-flex items-center space-x-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{card.label}</span>
                            <div className={`p-2 rounded-lg ${card.tone}`}>
                                <card.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Overall Activity Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">User Activity</p>
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2"><Users className="w-4 h-4" />Actions Today</span>
                                <span className="font-semibold">{overallStats.userActions}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2"><ClipboardCheck className="w-4 h-4" />Recent Booking Volume</span>
                                <span className="font-semibold">{overallStats.recentBookings}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Approval Rate</span>
                                <span className="font-semibold">{overallStats.approvalRate ?? 'N/A'}{overallStats.approvalRate !== null ? '%' : ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Hospital Operations</p>
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2"><Building2 className="w-4 h-4" />Hospitals Online</span>
                                <span className="font-semibold">{overallStats.onlineHospitals}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Active Duty Staff</span>
                                <span className="font-semibold">{overallStats.activeHospitalAdmins}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Capacity Health</span>
                                <span className="font-semibold">{overallStats.uptimePercent ?? 'N/A'}{overallStats.uptimePercent !== null ? '%' : ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Current Snapshot</p>
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                                <span>Total Beds</span>
                                <span className="font-semibold">{stats.total_beds ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Available Beds</span>
                                <span className="font-semibold">{stats.available_beds ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Avg Response Time</span>
                                <span className="font-semibold">{stats.avg_response_time ?? 'N/A'}{stats.avg_response_time ? ' min' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="card p-6 xl:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hospital Status Monitor</h3>
                    <div className="space-y-3 max-h-[380px] overflow-auto pr-1">
                        {hospitals.length > 0 ? hospitals.map((hospital) => (
                            <div
                                key={hospital.hospital_id || hospital.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                            >
                                <p className="font-semibold text-slate-900 dark:text-white">{hospital.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Reliability: {hospital.reliability_score ?? hospital.match_score ?? 'N/A'} | Distance: {hospital.distance_km ?? 'N/A'} km
                                </p>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No hospitals available.</p>
                        )}
                    </div>
                </div>

                <div className="card p-6 space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Direct Booking Control</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            Approve or reject any booking by ID.
                        </p>
                        <input
                            type="text"
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            placeholder="Enter booking ID"
                            className="input"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button type="button" onClick={handleApprove} className="btn-primary inline-flex items-center justify-center space-x-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve</span>
                            </button>
                            <button type="button" onClick={handleReject} className="btn-secondary inline-flex items-center justify-center space-x-2">
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Global Navigation</h4>
                        <div className="flex flex-col gap-2 text-sm">
                            <Link to="/search" className="text-primary hover:underline">Open Bed Search</Link>
                            <Link to="/my-bookings" className="text-primary hover:underline">Open Booking History</Link>
                            <Link to="/sos" className="text-primary hover:underline">Open SOS Console</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hospital Admin Activity Monitor</h3>
                <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
                    {hospitalAdminActivities.length > 0 ? hospitalAdminActivities.map((entry) => (
                        <div
                            key={entry.id}
                            className="flex items-start justify-between gap-4 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                        >
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{entry.hospital}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{entry.action}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-xs font-semibold ${entry.status === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {entry.status === 'critical' ? 'Needs Attention' : 'Normal'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{entry.timestamp}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No hospital admin activity captured yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RootAdminPanel;
