import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/" className="btn-primary flex items-center justify-center space-x-2">
                        <Home className="w-5 h-5" />
                        <span>Go Home</span>
                    </Link>
                    <Link to="/search" className="btn-secondary flex items-center justify-center space-x-2">
                        <Search className="w-5 h-5" />
                        <span>Find Hospitals</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
