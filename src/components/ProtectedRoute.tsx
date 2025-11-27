import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'user';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Check if user is authenticated
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    // Check role if required
    if (requiredRole) {
        try {
            const user = JSON.parse(userStr);

            if (user.role !== requiredRole) {
                // Redirect to unauthorized page or dashboard
                return <Navigate to="/unauthorized" replace />;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            return <Navigate to="/login" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
