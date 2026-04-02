import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">QUICKAID</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Find emergency hospital beds in seconds. Real-time bed tracking and smart hospital matching for critical care.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-primary transition-smooth">
                                <Mail className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-primary transition-smooth">
                                <Phone className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-primary transition-smooth">
                                <MapPin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/search" className="text-sm hover:text-primary transition-smooth">
                                    Find Hospitals
                                </Link>
                            </li>
                            <li>
                                <Link to="/sos" className="text-sm hover:text-primary transition-smooth">
                                    Emergency SOS
                                </Link>
                            </li>
                            <li>
                                <Link to="/my-bookings" className="text-sm hover:text-primary transition-smooth">
                                    My Bookings
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-sm hover:text-primary transition-smooth">
                                    Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-sm hover:text-primary transition-smooth">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-primary transition-smooth">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-primary transition-smooth">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-primary transition-smooth">
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-800 mt-8 pt-8 text-center">
                    <p className="text-sm text-slate-400">
                        © {currentYear} QUICKAID. All rights reserved. Built with ❤️ for saving lives.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
