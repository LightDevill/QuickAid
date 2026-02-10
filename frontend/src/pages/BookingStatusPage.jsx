import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, User, Phone, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { bookingApi } from '../api/bookingApi';
import { connectToBookingUpdates } from '../api/realtimeApi';
import useBookingStore from '../stores/bookingStore';
import useCountdown from '../hooks/useCountdown';
import { formatDate, formatTime } from '../utils/formatters';
import { BED_TYPE_LABELS, BOOKING_LOCK_WINDOW } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const BookingStatusPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateBooking } = useBookingStore();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sseConnection, setSseConnection] = useState(null);

    const { seconds, isActive, start: startCountdown } = useCountdown(BOOKING_LOCK_WINDOW, () => handleCountdownComplete());

    const handleCountdownComplete = () => {
        setBooking(prev => {
            if (prev && prev.status === 'pending') {
                const updated = {
                    ...prev,
                    status: 'rejected',
                    rejection_reason: 'not responded sending request for bed to the next nearest hospital'
                };
                updateBooking(updated);
                toast.error('Booking timeout: No response from hospital.');
                return updated;
            }
            return prev;
        });
    };

    useEffect(() => {
        fetchBooking();

        // Setup SSE for real-time updates
        const eventSource = connectToBookingUpdates(id, handleBookingUpdate);
        setSseConnection(eventSource);

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [id]);

    const fetchBooking = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getBooking(id);
            setBooking(data.booking);
            updateBooking(data.booking);

            // Start countdown if booking is pending
            if (data.booking.status === 'pending') {
                const createdTime = new Date(data.booking.created_at).getTime();
                const now = Date.now();
                const elapsed = Math.floor((now - createdTime) / 1000);
                const remaining = Math.max(0, BOOKING_LOCK_WINDOW - elapsed);

                if (remaining > 0) {
                    startCountdown(remaining);
                }
            }
        } catch (error) {
            console.error('Fetch booking error:', error);
            toast.error('Failed to load booking details');
            navigate('/bookings');
        } finally {
            setLoading(false);
        }
    };

    // Auto-approval simulation for demo booking
    useEffect(() => {
        let timeout;
        if (booking?.booking_id === 'bk_demo_auto_approve' && booking.status === 'pending') {
            timeout = setTimeout(() => {
                const approvedBooking = {
                    ...booking,
                    status: 'approved',
                    qr_token: 'demo_qr_approved_' + Date.now()
                };
                setBooking(approvedBooking);
                updateBooking(approvedBooking);
                toast.success('Simulation: Booking automatically approved by hospital!');
            }, 10000); // 10 seconds for demo
        }
        return () => clearTimeout(timeout);
    }, [booking?.booking_id, booking?.status]);

    const handleBookingUpdate = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.booking_id === id) {
                setBooking(data);
                updateBooking(data);

                // Show toast notification
                if (data.status === 'approved') {
                    toast.success('Booking approved! Please proceed to the hospital.');
                } else if (data.status === 'rejected') {
                    toast.error('Booking rejected. Please try another hospital.');
                } else if (data.status === 'expired') {
                    toast.error('Booking expired. The 90-second window has passed.');
                }
            }
        } catch (error) {
            console.error('SSE parse error:', error);
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `booking-${id}.png`;
                downloadLink.href = `${pngFile}`;
                downloadLink.click();
            };
            img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <LoadingSkeleton type="card" count={2} />
                </div>
            </div>
        );
    }

    if (!booking) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Status Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Booking Status
                        </h1>
                        <StatusBadge status={booking.status} size="lg" />
                    </div>

                    {/* Countdown Timer for Pending */}
                    {booking.status === 'pending' && isActive && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                                        ⏱️ Bed Lock Active
                                    </p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        Your bed is reserved. Please wait for hospital confirmation.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">
                                        {seconds}s
                                    </div>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300">remaining</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {booking.status === 'approved' && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="font-semibold text-green-800 dark:text-green-200">
                                        Booking Approved!
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Please proceed to the hospital and show your QR code at reception.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejection Message */}
                    {booking.status === 'rejected' && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                <div>
                                    <p className="font-semibold text-red-800 dark:text-red-200">
                                        Booking Rejected
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {booking.rejection_reason || 'The hospital could not accommodate your booking.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* QR Code - Only show for approved bookings */}
                {booking.status === 'approved' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-6 mb-6 text-center"
                    >
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                            Your QR Code
                        </h2>
                        <div className="inline-block p-4 bg-white rounded-lg">
                            <QRCodeSVG
                                id="qr-code-svg"
                                value={booking.booking_id}
                                size={200}
                                level="H"
                            />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 mb-4">
                            Show this QR code at hospital reception
                        </p>
                        <button
                            onClick={downloadQR}
                            className="btn-secondary inline-flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download QR Code</span>
                        </button>
                    </motion.div>
                )}

                {/* Booking Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6 mb-6"
                >
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Booking Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Booking ID</p>
                            <p className="font-mono text-sm text-slate-900 dark:text-white">
                                {booking.booking_id}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Created At</p>
                            <p className="text-slate-900 dark:text-white">
                                {formatDate(booking.created_at)} at {formatTime(booking.created_at)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Hospital</p>
                            <p className="text-slate-900 dark:text-white">{booking.hospital_name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Bed Type</p>
                            <p className="text-slate-900 dark:text-white">
                                {BED_TYPE_LABELS[booking.bed_type]}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Patient Name</p>
                            <p className="text-slate-900 dark:text-white">{booking.patient_name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Age / Gender</p>
                            <p className="text-slate-900 dark:text-white capitalize">
                                {booking.age} / {booking.gender}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Emergency Contact</p>
                            <p className="text-slate-900 dark:text-white">+91 {booking.emergency_contact}</p>
                        </div>

                        {booking.symptoms && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Symptoms</p>
                                <p className="text-slate-900 dark:text-white">{booking.symptoms}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Hospital Contact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6"
                >
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Hospital Contact
                    </h2>
                    <div className="space-y-3">
                        {booking.hospital_address && (
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                                <p className="text-slate-700 dark:text-slate-300">{booking.hospital_address}</p>
                            </div>
                        )}
                        {booking.hospital_phone && (
                            <div className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-slate-500" />
                                <a
                                    href={`tel:${booking.hospital_phone}`}
                                    className="text-primary hover:underline"
                                >
                                    {booking.hospital_phone}
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Real-time indicator */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Live updates enabled</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingStatusPage;
