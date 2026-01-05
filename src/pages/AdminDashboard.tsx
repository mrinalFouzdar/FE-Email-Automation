import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast } from 'react-toastify';
import api from '../services/api';
import LabelSuggestionCard from '../components/LabelSuggestionCard';
import AdminUserAccountManager from '../components/AdminUserAccountManager';
import { createUserSchema } from '../shared/schemas/admin.schema';

interface PendingLabelSuggestion {
    id: number;
    email_id: number;
    user_id: number;
    suggested_label_name: string;
    suggested_by: string;
    confidence_score: number;
    reasoning: string;
    status: string;
    created_at: string;
    email_subject: string;
    email_sender: string;
    email_body: string;
    user_email: string;
}

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    created_at: string;
    updated_at: string;
}

interface SystemStats {
    total_users: number;
    admin_count: number;
    total_accounts: number;
    active_accounts: number;
    total_emails: number;
    unread_emails: number;
    total_labels: number;
    system_labels: number;
    pending_suggestions: number;
}

const AdminDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'labels' | 'stats'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pendingLabels, setPendingLabels] = useState<PendingLabelSuggestion[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateUserForm, setShowCreateUserForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Check if user is admin
        if (parsedUser.role !== 'admin') {
            navigate('/');
            return;
        }

        // Fetch initial data
        fetchUsers();
        fetchPendingLabels();
        fetchSystemStats();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingLabels = async () => {
        try {
            // Fetch ALL pending label suggestions (admin view - all users)
            const response = await api.get('/labels/pending-suggestions');
            setPendingLabels(response.data.suggestions || []);
        } catch (error) {
            console.error('Failed to fetch pending label suggestions:', error);
        }
    };

    const fetchSystemStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setSystemStats(response.data.data || null);
        } catch (error) {
            console.error('Failed to fetch system stats:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSelectUser = (selectedUser: User) => {
        setSelectedUser(selectedUser);
    };

    const handleCloseUserManager = () => {
        setSelectedUser(null);
        fetchUsers(); // Refresh users list
        fetchSystemStats(); // Refresh stats
    };

    const handleCreateUser = async (values: any, { setFieldError, resetForm, setSubmitting }: any) => {
        try {
            const response = await api.post('/admin/users', values);
            const hasImap = values.imapHost && values.imapPassword;
            const successMsg = hasImap
                ? 'User and IMAP account created successfully! User can now login and emails will be fetched automatically.'
                : 'User created successfully!';

            toast.success(successMsg);

            resetForm();
            setShowCreateUserForm(false);
            fetchUsers();
            fetchSystemStats();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to create user';
            setFieldError('email', errorMsg);
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-right mr-4">
                                <p className="text-sm text-slate-300">{user?.name}</p>
                                <p className="text-xs text-slate-500 uppercase">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome, Admin!</h2>
                    <p className="text-slate-400">Manage users, email accounts, and system settings</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    <button
                        className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                            }`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Users Management
                    </button>
                    {/* <button
                        className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'labels'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                            }`}
                        onClick={() => setActiveTab('labels')}
                    >
                        🏷️ Label Approvals {pendingLabels.length > 0 && `(${pendingLabels.length})`}
                    </button> */}
                    <button
                        className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'stats'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                            }`}
                        onClick={() => setActiveTab('stats')}
                    >
                        📊 System Stats
                    </button>
                </div>

                {/* Users Management Tab */}
                {activeTab === 'users' && (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-8 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <span className="text-3xl">👥</span> User Management
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateUserForm(true)}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
                                >
                                    ➕ Create New User
                                </button>
                                <button
                                    onClick={fetchUsers}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                        </div>

                        {/* Create User Form */}
                        {showCreateUserForm && (
                            <Formik
                                initialValues={{
                                    email: '',
                                    password: '',
                                    name: '',
                                    role: 'user',
                                    imapHost: '',
                                    imapPort: 993,
                                    imapPassword: ''
                                }}
                                validationSchema={createUserSchema}
                                onSubmit={handleCreateUser}
                            >
                                {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                                    <div className="mb-6 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-white">Create New User</h4>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    {values.role === 'admin'
                                                        ? 'Creating an admin account (no IMAP configuration needed)'
                                                        : 'IMAP configuration is required for regular users. Emails will be fetched automatically.'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateUserForm(false)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>

                                        <Form className="space-y-4">
                                            {/* Section 1: User Info */}
                                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                                                <h5 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">👤 User Information</h5>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                                                            Name *
                                                        </label>
                                                        <Field
                                                            id="name"
                                                            name="name"
                                                            type="text"
                                                            className={`w-full px-4 py-2 bg-slate-700 border ${errors.name && touched.name ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                            placeholder="John Doe"
                                                        />
                                                        <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                                                            Email * <span className="text-xs text-slate-400">(Used for both system login & IMAP)</span>
                                                        </label>
                                                        <Field
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            className={`w-full px-4 py-2 bg-slate-700 border ${errors.email && touched.email ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                            placeholder="user@example.com"
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                const email = e.target.value;
                                                                setFieldValue('email', email);

                                                                // Auto-detect IMAP host based on email domain
                                                                const domain = email.split('@')[1];
                                                                if (domain === 'gmail.com') {
                                                                    setFieldValue('imapHost', 'imap.gmail.com');
                                                                } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
                                                                    setFieldValue('imapHost', 'outlook.office365.com');
                                                                } else if (domain === 'yahoo.com') {
                                                                    setFieldValue('imapHost', 'imap.mail.yahoo.com');
                                                                } else if (domain === 'icloud.com') {
                                                                    setFieldValue('imapHost', 'imap.mail.me.com');
                                                                }
                                                            }}
                                                        />
                                                        <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                                                            System Login Password *
                                                        </label>
                                                        <Field
                                                            id="password"
                                                            name="password"
                                                            type="password"
                                                            className={`w-full px-4 py-2 bg-slate-700 border ${errors.password && touched.password ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                            placeholder="••••••••"
                                                        />
                                                        <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                                                        <p className="text-xs text-slate-400 mt-1">Min 6 characters (for logging into this application)</p>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="role" className="block text-sm font-semibold text-slate-300 mb-2">
                                                            Role *
                                                        </label>
                                                        <Field
                                                            id="role"
                                                            name="role"
                                                            as="select"
                                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="admin">Admin</option>
                                                        </Field>
                                                        <ErrorMessage name="role" component="div" className="text-red-400 text-xs mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 2: IMAP Configuration - Only for regular users */}
                                            {values.role === 'user' && (
                                                <div className="p-4 bg-slate-800/50 rounded-lg border border-red-900/30 bg-red-900/5">
                                                    <h5 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">📧 IMAP Email Configuration <span className="text-red-400">(Required for Users)</span></h5>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="imapHost" className="block text-sm font-semibold text-slate-300 mb-2">
                                                                IMAP Host *
                                                            </label>
                                                            <Field
                                                                id="imapHost"
                                                                name="imapHost"
                                                                type="text"
                                                                className={`w-full px-4 py-2 bg-slate-700 border ${errors.imapHost && touched.imapHost ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                                placeholder="imap.gmail.com"
                                                            />
                                                            <ErrorMessage name="imapHost" component="div" className="text-red-400 text-xs mt-1" />
                                                            <p className="text-xs text-slate-400 mt-1">Auto-detected based on email domain</p>
                                                        </div>
                                                        <div>
                                                            <label htmlFor="imapPort" className="block text-sm font-semibold text-slate-300 mb-2">
                                                                IMAP Port *
                                                            </label>
                                                            <Field
                                                                id="imapPort"
                                                                name="imapPort"
                                                                type="number"
                                                                className={`w-full px-4 py-2 bg-slate-700 border ${errors.imapPort && touched.imapPort ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                                placeholder="993"
                                                            />
                                                            <ErrorMessage name="imapPort" component="div" className="text-red-400 text-xs mt-1" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <label htmlFor="imapPassword" className="block text-sm font-semibold text-slate-300 mb-2">
                                                            IMAP Password *
                                                        </label>
                                                        <Field
                                                            id="imapPassword"
                                                            name="imapPassword"
                                                            type="password"
                                                            className={`w-full px-4 py-2 bg-slate-700 border ${errors.imapPassword && touched.imapPassword ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                            placeholder="••••••••"
                                                        />
                                                        <ErrorMessage name="imapPassword" component="div" className="text-red-400 text-xs mt-1" />
                                                        <p className="text-xs text-slate-400 mt-1">Email account password (for Gmail, use App Password)</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Info box - different for admin vs user */}
                                            {values.role === 'admin' ? (
                                                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-200 text-sm">
                                                    <strong>👑 Admin Account:</strong>
                                                    <ul className="mt-2 ml-4 list-disc space-y-1">
                                                        <li>No IMAP configuration needed</li>
                                                        <li>Admin can manage all users and settings</li>
                                                        <li>No email fetching for admin accounts</li>
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-200 text-sm">
                                                    <strong>✅ What happens after creating:</strong>
                                                    <ul className="mt-2 ml-4 list-disc space-y-1">
                                                        <li>User account created instantly</li>
                                                        <li>IMAP account configured automatically</li>
                                                        <li>Emails fetched in background (no user login needed!)</li>
                                                        <li>AI classification applied automatically</li>
                                                        <li>User can login and see all emails ready</li>
                                                    </ul>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Creating...' : (values.role === 'admin' ? '✅ Create Admin User' : '✅ Create User & Start Email Sync')}
                                            </button>
                                        </Form>
                                    </div>
                                )}
                            </Formik>
                        )}

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-slate-400">Loading users...</p>
                            </div>
                        ) : users.filter(u => u.role !== 'admin').length === 0 ? (
                            <div className="text-center py-12 px-5 text-slate-400">
                                <span className="text-6xl mb-4 block">👤</span>
                                <p className="text-lg font-medium">No users found</p>
                                <p className="text-sm mt-2">Create a new user to manage their IMAP accounts</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="pb-3 text-slate-400 font-semibold">Name</th>
                                            <th className="pb-3 text-slate-400 font-semibold">Email</th>
                                            <th className="pb-3 text-slate-400 font-semibold">Role</th>
                                            <th className="pb-3 text-slate-400 font-semibold">Joined</th>
                                            <th className="pb-3 text-slate-400 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u => u.role !== 'admin').map((userData) => (
                                            <tr key={userData.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                                                <td className="py-4 text-white font-medium">{userData.name}</td>
                                                <td className="py-4 text-slate-300">{userData.email}</td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${userData.role === 'admin'
                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                        }`}>
                                                        {userData.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-slate-400 text-sm">
                                                    {new Date(userData.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => navigate(`/admin/users/${userData.id}/emails`)}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold"
                                                        >
                                                            📧 View Emails
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/users/${userData.id}/suggestions`)}
                                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-semibold"
                                                        >
                                                            🤖 AI Suggestions
                                                        </button>
                                                        <button
                                                            onClick={() => handleSelectUser(userData)}
                                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-semibold"
                                                        >
                                                            ⚙️ Manage Accounts
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Pending Labels Tab */}
                {activeTab === 'labels' && (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-8 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                                    <span className="text-3xl">🏷️</span> Label Approvals (All Users)
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Review AI-suggested labels from all users
                                </p>
                            </div>
                            <button
                                onClick={fetchPendingLabels}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {pendingLabels.length === 0 ? (
                            <div className="text-center py-12 px-5 text-slate-400">
                                <span className="text-6xl mb-4 block">✅</span>
                                <p className="text-lg font-medium">No pending label suggestions</p>
                                <p className="text-sm mt-2">All AI-suggested labels have been reviewed by users</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingLabels.map((suggestion) => (
                                    <div key={suggestion.id} className="relative">
                                        {/* User Badge */}
                                        <div className="absolute -top-2 -right-2 z-10 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                                            👤 {suggestion.user_email}
                                        </div>
                                        <LabelSuggestionCard
                                            suggestion={{
                                                id: suggestion.id,
                                                email_id: suggestion.email_id,
                                                suggested_label_name: suggestion.suggested_label_name,
                                                confidence_score: suggestion.confidence_score,
                                                reasoning: suggestion.reasoning,
                                                subject: suggestion.email_subject,
                                                sender_email: suggestion.email_sender,
                                                received_at: suggestion.created_at
                                            }}
                                            onProcess={fetchPendingLabels}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* System Stats Tab */}
                {activeTab === 'stats' && systemStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{systemStats.total_users}</h3>
                            <p className="text-slate-400 text-sm">Total Users</p>
                            <p className="text-xs text-slate-500 mt-1">{systemStats.admin_count} admins</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{systemStats.total_accounts}</h3>
                            <p className="text-slate-400 text-sm">Email Accounts</p>
                            <p className="text-xs text-slate-500 mt-1">{systemStats.active_accounts} active</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{systemStats.total_labels}</h3>
                            <p className="text-slate-400 text-sm">Total Labels</p>
                            <p className="text-xs text-slate-500 mt-1">{systemStats.system_labels} system labels</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{systemStats.total_emails}</h3>
                            <p className="text-slate-400 text-sm">Total Emails</p>
                            <p className="text-xs text-slate-500 mt-1">{systemStats.unread_emails} unread</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{systemStats.pending_suggestions}</h3>
                            <p className="text-slate-400 text-sm">Pending Label Suggestions</p>
                        </div>
                    </div>
                )}
            </main>

            {/* User Account Manager Modal */}
            {selectedUser && (
                <AdminUserAccountManager
                    user={selectedUser}
                    onClose={handleCloseUserManager}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
