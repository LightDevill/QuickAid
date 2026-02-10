import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Search, Heart, Clock, Hospital, Bed, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const features = [
        {
            icon: Search,
            title: 'Smart Hospital Search',
            description: 'Find hospitals with available beds based on distance, bed type, and medical capabilities',
        },
        {
            icon: Clock,
            title: 'Real-time Updates',
            description: 'Live bed availability tracking updated every few minutes for accurate information',
        },
        {
            icon: Heart,
            title: 'Emergency SOS',
            description: 'One-tap emergency alert with automatic hospital matching for critical situations',
        },
    ];

    const steps = [
        {
            number: '1',
            title: 'Search',
            description: 'Enter your location and select the type of bed you need',
        },
        {
            number: '2',
            title: 'Book',
            description: 'Choose a hospital and reserve a bed with our 90-second lock window',
        },
        {
            number: '3',
            title: 'Arrive',
            description: 'Show your QR code at the hospital for quick check-in',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                                Find Emergency Hospital Beds
                                <br />
                                <span className="text-primary">in Seconds</span>
                            </h1>
                            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
                                Real-time bed tracking and smart hospital matching for critical care.
                                Save precious time when every second counts.
                            </p>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            <Link
                                to="/search"
                                className="btn-primary text-lg px-8 py-4 flex items-center space-x-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>Find Beds Now</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/sos"
                                className="btn-accent text-lg px-8 py-4 flex items-center space-x-2 pulse-ring"
                            >
                                <AlertCircle className="w-5 h-5" />
                                <span>🚨 Emergency SOS</span>
                            </Link>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                                <div className="text-slate-600 dark:text-slate-400">Hospitals</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                                <div className="text-slate-600 dark:text-slate-400">Beds Tracked</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">30s</div>
                                <div className="text-slate-600 dark:text-slate-400">Average Response</div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Why Choose QUICKAID?
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            Cutting-edge technology to save lives in critical moments
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="card p-8 hover:shadow-xl transition-smooth"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                                    <feature.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            Three simple steps to find and book a hospital bed
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="card p-8 text-center">
                                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                        {step.number}
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        {step.description}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight className="w-8 h-8 text-primary" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-teal-100 mb-8">
                        Join thousands of users who trust QUICKAID for emergency healthcare
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center space-x-2 bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition-smooth"
                    >
                        <span>Get Started Now</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
