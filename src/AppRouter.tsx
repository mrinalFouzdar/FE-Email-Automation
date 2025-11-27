import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes - any authenticated user */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <App />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Admin-only routes */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
