import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const RoleGuard = ({ children, allowedRoles = [] }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/access-denied" replace />;
    }

    return children ? children : <Outlet />;
};

export default RoleGuard;
