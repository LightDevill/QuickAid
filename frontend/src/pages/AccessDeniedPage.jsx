import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const AccessDeniedPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="max-w-md w-full text-center">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Access Denied
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                <Link to="/" className="btn-primary inline-flex items-center space-x-2">
                    <Home className="w-5 h-5" />
                    <span>Go to Homepage</span>
                </Link>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
