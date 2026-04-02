import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { bookingApi } from '../api/bookingApi';
import useBookingStore from '../stores/bookingStore';
import { formatDate, formatTime } from '../utils/formatters';
import { BED_TYPE_LABELS, BOOKING_LOCK_WINDOW } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import useCountdown from '../hooks/useCountdown';

const MyBookingsPage = () => {
    const { bookings, setBookings } = useBookingStore();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected, expired, cancelled

    useEffect(() => {
        // Only fetch if we don't have bookings in the store
        // This prevents overwriting locally simulated chain bookings when navigating back
        if (bookings.length === 0) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getMyBookings();
            setBookings(data.bookings || []);
        } catch (error) {
            console.error('Fetch bookings error:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredBookings = () => {
        let filtered = bookings;
        if (activeTab !== 'all') {
            filtered = bookings.filter(booking => booking.status === activeTab);
        }

        // Priority logic: Pending > Approved > Others. Newer dates within groups.
        return [...filtered].sort((a, b) => {
            // 1. Pending priority
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;

            // 2. Approved priority
            if (a.status === 'approved' && b.status !== 'approved' && b.status !== 'pending') return -1;
            if (a.status !== 'approved' && a.status !== 'pending' && b.status === 'approved') return 1;

            // 3. Newest first for everything else or within the same priority
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    };

    const filteredBookings = getFilteredBookings();

    const tabs = [
        { id: 'all', label: 'All', count: bookings.length },
        { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
        { id: 'approved', label: 'Approved', count: bookings.filter(b => b.status === 'approved').length },
        { id: 'rejected', label: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length },
        { id: 'expired', label: 'Expired', count: bookings.filter(b => b.status === 'expired').length },
        { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        My Bookings
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        View and manage your hospital bed bookings
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-smooth ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="space-y-4">
                        <LoadingSkeleton type="card" count={3} />
                    </div>
                ) : filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBookings.map((booking, index) => (
                            <BookingCard key={booking.booking_id} booking={booking} index={index} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        type="inbox"
                        icon={FileText}
                        title={`No ${activeTab === 'all' ? '' : activeTab} bookings`}
                        message="You haven't made any bookings yet. Start by searching for hospitals."
                        action={
                            <Link to="/search" className="btn-primary">
                                Search Hospitals
                            </Link>
                        }
                    />
                )}
            </div>
        </div>
    );
};

// Booking Card Component
const BookingCard = ({ booking, index }) => {
    const { updateBooking, addBooking, updateBookingStatus } = useBookingStore();
    const isProcessingRef = useRef(false);

    // Handle timeout chain reaction
    const handleTimeout = () => {
        // Prevent multiple executions for the same card instance
        if (isProcessingRef.current || booking.status !== 'pending') return;
        isProcessingRef.current = true;

        const expiredBooking = {
            ...booking,
            status: 'expired',
            rejection_reason: 'not responded sending request for bed to the next nearest hospital'
        };
        updateBooking(expiredBooking);
        toast.error('Booking timeout: No response from hospital.');

        // Trigger chain reaction if it's our specific demo booking
        if (booking.booking_id === 'bk_demo_auto_reject' || booking.hospital_name.includes('Lilavati')) {
            const newBookingId = 'bk_chain_' + Date.now();

            // Step 1: Immediately add a PENDING booking at the next hospital
            const newPendingBooking = {
                ...booking, // Inherit EVERYTHING (patient_name, symptoms, bed_type, etc.)
                booking_id: newBookingId,
                hospital_id: 'hosp_kokilaben_002',
                hospital_name: 'Kokilaben Dhirubhai Ambani Hospital',
                hospital_address: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai',
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                qr_token: null // Reset QR until approved
            };

            setTimeout(() => {
                addBooking(newPendingBooking);
                toast('System: Sending request to next nearest hospital...', {
                    icon: '🔄',
                    duration: 4000
                });

                // Step 2: 12 seconds later, update it to APPROVED (making it 12s as requested 10-15 range)
                setTimeout(() => {
                    updateBookingStatus(newBookingId, 'approved');
                    toast.success('System: New booking accepted at Kokilaben Hospital!');
                }, 12000);
            }, 1500);
        }
    };

    const { seconds, isActive, start: startCountdown } = useCountdown(BOOKING_LOCK_WINDOW, handleTimeout);

    useEffect(() => {
        if (booking.status === 'pending') {
            const createdTime = new Date(booking.created_at).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - createdTime) / 1000);
            const remaining = Math.max(0, BOOKING_LOCK_WINDOW - elapsed);

            if (remaining > 0) {
                startCountdown(remaining);
            } else {
                handleTimeout();
            }
        }
    }, [booking.status, booking.created_at, booking.booking_id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
        >
            <Link
                to={`/booking-status/${booking.booking_id}`}
                className="card p-6 hover:shadow-lg transition-smooth block border-l-4 border-l-transparent hover:border-l-primary"
            >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Booking Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                    {booking.hospital_name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></span>
                                    {booking.hospital_address}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <StatusBadge status={booking.status} size="md" />
                                {booking.status === 'pending' && isActive && (
                                    <div className="flex items-center space-x-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-100 dark:border-yellow-800">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                        <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider">
                                            Expires in {seconds}s
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Patient</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {booking.patient_name}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Bed Type</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {BED_TYPE_LABELS[booking.bed_type]}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Date</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {formatDate(booking.created_at)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Time</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {formatTime(booking.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* View Details Button */}
                    <div className="lg:w-40 shrink-0">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white rounded-xl transition-smooth shadow-sm">
                            <span className="text-sm font-bold uppercase tracking-wide">View Details</span>
                            <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default MyBookingsPage;
