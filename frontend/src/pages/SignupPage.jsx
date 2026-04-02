import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import useCountdown from '../hooks/useCountdown';
import { authApi } from '../api/authApi';
import { validatePhone, validateOTP } from '../utils/validators';
import { OTP_LENGTH, OTP_RESEND_TIMEOUT } from '../utils/constants';

const SignupPage = () => {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
    const [requestId, setRequestId] = useState(null);
    const [step, setStep] = useState('details');
    const [loading, setLoading] = useState(false);
    const [devOtp, setDevOtp] = useState(null);

    const otpInputRefs = useRef([]);

    const { seconds, isActive, start: startCountdown, reset: resetCountdown } = useCountdown(
        OTP_RESEND_TIMEOUT
    );

    useEffect(() => {
        if (step === 'otp' && otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
        }
    }, [step]);

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            setPhone(value);
        }
    };

    const handleSendOtp = async () => {
        if (!name.trim()) {
            toast.error('Please enter your full name');
            return;
        }
        if (!validatePhone(phone)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            const fullPhone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
            const response = await authApi.sendOtp(fullPhone);
            const data = response?.data || response;

            setRequestId(data.request_id);
            setStep('otp');
            startCountdown();
            toast.success('OTP sent successfully');

            const otpValue = data.otp || data.otp_dev_only;
            if (otpValue) {
                setDevOtp(String(otpValue));
                toast.success(`Dev Mode - OTP: ${otpValue}`, { duration: 10000 });
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            toast.error('Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < OTP_LENGTH - 1) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

        if (pastedData.length === OTP_LENGTH) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            otpInputRefs.current[OTP_LENGTH - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (!validateOTP(otpString)) {
            toast.error(`Please enter a valid ${OTP_LENGTH}-digit OTP`);
            return;
        }

        setLoading(true);
        try {
            const fullPhone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
            // Pass name to be registered
            const response = await authApi.verifyOtp(requestId, otpString, fullPhone, null, name);
            const data = response?.data || response;

            const accessToken = data.access_token || data.accessToken;
            const refreshToken = data.refresh_token || data.refreshToken;
            const user = data.user;

            if (accessToken && user) {
                login(
                    {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    },
                    user
                );

                toast.success('Registration and Login successful!');
                navigate(from, { replace: true });
            } else {
                toast.error('Invalid response from server');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            toast.error('Invalid OTP');
            setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
            otpInputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (isActive) return;

        setLoading(true);
        try {
            const fullPhone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
            const response = await authApi.sendOtp(fullPhone);
            const data = response?.data || response;

            setRequestId(data.request_id);
            setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
            resetCountdown(OTP_RESEND_TIMEOUT);
            startCountdown();
            toast.success('OTP resent successfully');

            const otpValue = data.otp || data.otp_dev_only;
            if (otpValue) {
                setDevOtp(String(otpValue));
                toast.success(`Dev Mode - OTP: ${otpValue}`, { duration: 10000 });
            }

            otpInputRefs.current[0]?.focus();
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeDetails = () => {
        setStep('details');
        setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
        setRequestId(null);
        setDevOtp(null);
        resetCountdown();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 dark:from-slate-900 dark:to-slate-800 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            {step === 'details' ? (
                                <User className="w-8 h-8 text-white" />
                            ) : (
                                <Phone className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            {step === 'details' ? 'Create an Account' : 'Verify OTP'}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            {step === 'details'
                                ? 'Enter your details to register'
                                : `We sent a code to +91 ${phone}`}
                        </p>
                    </div>

                    {step === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <User className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="input pl-12"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSendOtp();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="9876543210"
                                        className="input pl-14"
                                        maxLength={10}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSendOtp();
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={loading || !phone || !name.trim()}
                                className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send OTP</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
                                    Enter {OTP_LENGTH}-Digit OTP
                                </label>
                                <div className="flex justify-center space-x-3">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => {
                                                otpInputRefs.current[index] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => {
                                                handleOtpKeyDown(index, e);
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (otp.every((d) => d)) {
                                                        handleVerifyOtp();
                                                    }
                                                }
                                            }}
                                            onPaste={index === 0 ? handleOtpPaste : undefined}
                                            className="w-14 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-smooth"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                {isActive ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Resend OTP in <span className="font-semibold text-primary">{seconds}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                        className="text-sm text-primary hover:underline font-medium"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.some((d) => !d)}
                                className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Verify OTP</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleChangeDetails}
                                className="btn-secondary w-full"
                            >
                                Change Details
                            </button>
                        </div>
                    )}

                    {devOtp && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                                🔧 Dev Mode - OTP: <span className="font-mono font-bold">{devOtp}</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-slate-600 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            Log in here
                        </Link>
                    </p>
                </div>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                    By registering, you agree to our Terms of Service and Privacy Policy
                </p>
            </motion.div>
        </div>
    );
};

export default SignupPage;
