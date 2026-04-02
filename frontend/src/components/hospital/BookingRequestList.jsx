import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Clock,
    CheckCircle,
    XCircle,
    User,
    Activity,
    ChevronRight,
    History,
    Calendar,
    Phone,
    UserMinus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingApi } from '../../api/bookingApi';
import { BED_TYPE_LABELS } from '../../utils/constants';

const BookingRequestList = ({ hospitalId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState('pending'); // 'pending', 'active', 'history'

    useEffect(() => {
        fetchBookings();
    }, [hospitalId]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getHospitalBookings(hospitalId);
            setBookings(data.bookings || []);
        } catch (error) {
            console.error('Fetch bookings error:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bookingId, action) => {
        try {
            if (action === 'approve') {
                await bookingApi.approveBooking(bookingId);
                toast.success('Booking approved');
            } else {
                await bookingApi.rejectBooking(bookingId);
                toast.success('Booking rejected');
            }
            fetchBookings();
        } catch (error) {
            console.error('Booking action error:', error);
            toast.error(`Failed to ${action} booking`);
        }
    };

    const handleDischarge = async () => {
        try {
            // Mock discharge API call
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success('Patient discharged. Bed availability updated.');
            // In a real app, this would update the bed count on the server
            fetchBookings();
        } catch {
            toast.error('Discharge failed');
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (hospitalId && b.hospital_id !== hospitalId) return false;
        if (currentTab === 'pending') return b.status === 'pending';
        if (currentTab === 'active') return b.status === 'approved';
        return b.status === 'rejected' || b.status === 'cancelled' || b.status === 'completed' || b.status === 'expired';
    });

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Patient Request Management
                    </h2>
                    <p className="text-sm text-slate-500">Review and process incoming hospital bookings</p>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    {[
                        { id: 'pending', label: 'Pending', icon: Clock },
                        { id: 'active', label: 'Active Patients', icon: Activity },
                        { id: 'history', label: 'Recent History', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${currentTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No {currentTab} requests found</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => (
                        <div key={booking.id || booking.booking_id} className="card p-5 group hover:shadow-md transition-shadow">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-2xl ${booking.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                        booking.status === 'approved' ? 'bg-green-50 text-green-600' :
                                            'bg-slate-50 text-slate-400'
                                        }`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white">
                                                {booking.patient_name || 'Patient'} #{(booking.id || booking.booking_id || 'UNKNOWN').slice(-6).toUpperCase()}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-200 text-slate-600'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs font-medium text-slate-500">
                                            <div className="flex items-center gap-1.5 capitalize">
                                                <Activity className="w-3 h-3 text-primary" />
                                                {BED_TYPE_LABELS[booking.bed_type]}
                                            </div>
                                            <div className="flex items-center gap-1.5 capitalize">
                                                <Calendar className="w-3 h-3" />
                                                {booking.patient_age && `${booking.patient_age}y, `}{booking.patient_gender}
                                            </div>
                                            <div className="flex items-center gap-1.5 capitalize col-span-2 sm:col-span-1">
                                                <Phone className="w-3 h-3" />
                                                Contact Info Provided
                                            </div>
                                            <div className="flex items-center gap-1.5 italic text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {new Date(booking.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(booking.created_at || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </div>
                                        </div>
                                        {booking.symptoms && (
                                            <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                                                <span className="font-bold uppercase text-[9px] text-slate-400 block mb-1">Reported Symptoms</span>
                                                {booking.symptoms}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-6">
                                    <Link
                                        to={`/booking-status/${booking.booking_id || booking.id}`}
                                        className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                                    >
                                        <span>View Status</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                    {booking.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleAction(booking.booking_id || booking.id, 'reject')}
                                                className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Reject</span>
                                            </button>
                                            <button
                                                onClick={() => handleAction(booking.booking_id || booking.id, 'approve')}
                                                className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-700 shadow-md shadow-primary/20 transition-all active:scale-95"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Accept Patient</span>
                                            </button>
                                        </>
                                    ) : booking.status === 'approved' ? (
                                        <button
                                            onClick={handleDischarge}
                                            className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-all"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                            <span>Discharge Patient</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                            <span>Closed</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BookingRequestList;
