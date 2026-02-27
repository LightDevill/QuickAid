import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, User, LogOut, Home, Search, FileText, Activity } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useUIStore from '../../stores/uiStore';
import { useState } from 'react';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { darkMode, toggleDarkMode, mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        setUserMenuOpen(false);
    };

    const navLinks = isAuthenticated
        ? user?.role === 'hospital_admin'
            ? [
                { to: '/dashboard', label: 'Hospital Management', icon: Home },
            ]
            : user?.role === 'quickaid_admin'
                ? [
                    { to: '/dashboard', label: 'Control Center', icon: Home },
                    { to: '/search', label: 'Search', icon: Search },
                    { to: '/my-bookings', label: 'Bookings', icon: FileText },
                ]
            : [
                { to: '/dashboard', label: 'Dashboard', icon: Home },
                { to: '/search', label: 'Search', icon: Search },
                { to: '/my-bookings', label: 'My Bookings', icon: FileText },
            ]
        : [];

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-primary">QUICKAID</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-smooth"
                            >
                                <link.icon className="w-4 h-4" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center space-x-4">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-600" />
                            )}
                        </button>

                        {/* User menu */}
                        {isAuthenticated && user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
                                >
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {user.name || user.phone}
                                    </span>
                                </button>

                                {/* Dropdown menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2">
                                        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {user.name || 'User'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.phone}</p>
                                            <p className="text-xs text-primary capitalize">{user.role?.replace('_', ' ')}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="btn-primary text-sm"
                            >
                                Login
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                            ) : (
                                <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="px-4 py-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={closeMobileMenu}
                                className="flex items-center space-x-2 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
                            >
                                <link.icon className="w-5 h-5" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
