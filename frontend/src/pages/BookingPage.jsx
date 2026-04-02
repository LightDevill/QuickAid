import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { hospitalApi } from '../api/hospitalApi';
import { bookingApi } from '../api/bookingApi';
import useBookingStore from '../stores/bookingStore';
import { BED_TYPES, BED_TYPE_LABELS } from '../utils/constants';
import { validateBookingData } from '../utils/validators';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const BookingPage = () => {
    const { hospitalId } = useParams();
    const navigate = useNavigate();
    const { addBooking, setActiveBooking } = useBookingStore();

    const [step, setStep] = useState(1); // 1: Bed Type, 2: Patient Details, 3: Review
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedBedType, setSelectedBedType] = useState('');

    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const formData = watch();

    useEffect(() => {
        fetchHospital();
    }, [hospitalId]);

    const fetchHospital = async () => {
        setLoading(true);
        try {
            const data = await hospitalApi.getHospital(hospitalId);
            setHospital(data.hospital);
        } catch (error) {
            console.error('Fetch hospital error:', error);
            toast.error('Failed to load hospital details');
            navigate('/search');
        } finally {
            setLoading(false);
        }
    };

    const handleBedTypeSelect = (bedType) => {
        setSelectedBedType(bedType);
        setStep(2);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const onSubmit = async (data) => {
        const bookingData = {
            hospital_id: hospitalId,
            bed_type: selectedBedType,
            patient_name: data.patient_name,
            age: parseInt(data.age),
            gender: data.gender,
            emergency_contact: data.emergency_contact,
            symptoms: data.symptoms || '',
        };

        const validation = validateBookingData(bookingData);
        if (!validation.isValid) {
            Object.values(validation.errors).forEach(error => toast.error(error));
            return;
        }

        setSubmitting(true);
        try {
            const response = await bookingApi.createBooking(bookingData);

            addBooking(response.booking);
            setActiveBooking(response.booking);

            toast.success('Booking created successfully!');
            navigate(`/booking-status/${response.booking.booking_id}`);
        } catch (error) {
            console.error('Create booking error:', error);
            toast.error(error.response?.data?.error || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <LoadingSkeleton type="card" count={2} />
                </div>
            </div>
        );
    }

    if (!hospital) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${s <= step ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    }`}>
                                    {s < step ? <Check className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                        <span className={step >= 1 ? 'text-primary font-medium' : 'text-slate-500'}>
                            Bed Type
                        </span>
                        <span className={step >= 2 ? 'text-primary font-medium' : 'text-slate-500'}>
                            Patient Details
                        </span>
                        <span className={step >= 3 ? 'text-primary font-medium' : 'text-slate-500'}>
                            Review
                        </span>
                    </div>
                </div>

                {/* Hospital Info */}
                <div className="card p-4 mb-6">
                    <h2 className="font-semibold text-slate-900 dark:text-white">{hospital.name}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{hospital.address}</p>
                </div>

                {/* Step 1: Bed Type Selection */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-6"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            Select Bed Type
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hospital.beds?.map((bed) => (
                                <button
                                    key={bed.bed_type}
                                    onClick={() => handleBedTypeSelect(bed.bed_type)}
                                    disabled={bed.available === 0}
                                    className={`p-6 rounded-lg border-2 transition-smooth text-left ${bed.available === 0
                                            ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-lg'
                                        }`}
                                >
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        {BED_TYPE_LABELS[bed.bed_type]}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        Available: <span className="font-bold">{bed.available}</span> / {bed.total}
                                    </p>
                                    {bed.available === 0 && (
                                        <span className="text-xs text-red-600 dark:text-red-400">
                                            No beds available
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Patient Details */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-6"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            Patient Details
                        </h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Patient Name *
                                </label>
                                <input
                                    {...register('patient_name', { required: true, minLength: 2 })}
                                    type="text"
                                    className="input"
                                    placeholder="Enter patient name"
                                />
                                {errors.patient_name && (
                                    <p className="text-sm text-red-600 mt-1">Patient name is required</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Age *
                                    </label>
                                    <input
                                        {...register('age', { required: true, min: 0, max: 150 })}
                                        type="number"
                                        className="input"
                                        placeholder="Age"
                                    />
                                    {errors.age && (
                                        <p className="text-sm text-red-600 mt-1">Valid age required</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Gender *
                                    </label>
                                    <select {...register('gender', { required: true })} className="input">
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.gender && (
                                        <p className="text-sm text-red-600 mt-1">Gender is required</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Emergency Contact *
                                </label>
                                <input
                                    {...register('emergency_contact', { required: true, pattern: /^[6-9]\d{9}$/ })}
                                    type="tel"
                                    className="input"
                                    placeholder="10-digit phone number"
                                    maxLength={10}
                                />
                                {errors.emergency_contact && (
                                    <p className="text-sm text-red-600 mt-1">Valid 10-digit number required</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Symptoms / Notes
                                </label>
                                <textarea
                                    {...register('symptoms')}
                                    className="input"
                                    rows={4}
                                    placeholder="Describe symptoms or any special requirements"
                                ></textarea>
                            </div>
                        </form>

                        <div className="flex justify-between mt-6">
                            <button onClick={handleBack} className="btn-secondary flex items-center space-x-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back</span>
                            </button>
                            <button onClick={handleNext} className="btn-primary flex items-center space-x-2">
                                <span>Next</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-6"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            Review & Confirm
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Hospital</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{hospital.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Bed Type</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {BED_TYPE_LABELS[selectedBedType]}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Patient Name</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{formData.patient_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Age / Gender</p>
                                    <p className="font-medium text-slate-900 dark:text-white capitalize">
                                        {formData.age} / {formData.gender}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Emergency Contact</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        +91 {formData.emergency_contact}
                                    </p>
                                </div>
                                {formData.symptoms && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Symptoms</p>
                                        <p className="font-medium text-slate-900 dark:text-white">{formData.symptoms}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ⏱️ Your bed will be locked for <strong>90 seconds</strong> after booking.
                                    Please arrive at the hospital promptly.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={handleBack} className="btn-secondary flex items-center space-x-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back</span>
                            </button>
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={submitting}
                                className="btn-primary flex items-center space-x-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Confirming...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>Confirm Booking</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
