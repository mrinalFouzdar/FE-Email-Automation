import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import CreateUserPage from './pages/admin/CreateUserPage';
import UserLabelSuggestions from './pages/UserLabelSuggestions';
import UserEmails from './pages/UserEmails';

// Old Admin Dashboard (for backward compatibility during transition)
import AdminDashboard from './pages/AdminDashboard';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes - user dashboard (admins redirected to /admin) */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute excludedRole="admin">
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Redirect /dashboard to / for consistency */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />

                {/* Admin routes with sidebar layout */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Dashboard - default admin page */}
                    <Route index element={<DashboardPage />} />

                    {/* User Management */}
                    <Route path="users" element={<UsersPage />} />
                    <Route path="users/create" element={<CreateUserPage />} />
                    <Route path="users/:userId/emails" element={<UserEmails />} />
                    <Route path="users/:userId/suggestions" element={<UserLabelSuggestions />} />

                    {/* Label Management */}
                    <Route path="labels" element={<AdminDashboard />} />

                    {/* System Stats */}
                    <Route path="stats" element={<AdminDashboard />} />
                </Route>

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
