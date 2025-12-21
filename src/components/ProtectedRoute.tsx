import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'user';
    excludedRole?: 'admin' | 'user';
    redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, excludedRole, redirectTo }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Check if user is authenticated
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);

        // Check if user's role is excluded from this route
        if (excludedRole && user.role === excludedRole) {
            const defaultRedirect = excludedRole === 'admin' ? '/admin' : '/';
            return <Navigate to={redirectTo || defaultRedirect} replace />;
        }

        // Check role if required
        if (requiredRole && user.role !== requiredRole) {
            // Redirect to unauthorized page or dashboard
            return <Navigate to="/unauthorized" replace />;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
