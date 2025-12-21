import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

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

const DashboardPage = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch system stats');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl opacity-80">👥</div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-4xl font-bold">{stats?.total_users || 0}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm text-blue-100 border-t border-blue-400 pt-3">
            <span>Admins: {stats?.admin_count || 0}</span>
            <span>Users: {(stats?.total_users || 0) - (stats?.admin_count || 0)}</span>
          </div>
        </div>

        {/* Email Accounts Stats */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl opacity-80">📧</div>
            <div className="text-right">
              <p className="text-purple-100 text-sm">Email Accounts</p>
              <p className="text-4xl font-bold">{stats?.total_accounts || 0}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm text-purple-100 border-t border-purple-400 pt-3">
            <span>Active: {stats?.active_accounts || 0}</span>
            <span>Inactive: {(stats?.total_accounts || 0) - (stats?.active_accounts || 0)}</span>
          </div>
        </div>

        {/* Emails Stats */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl opacity-80">✉️</div>
            <div className="text-right">
              <p className="text-pink-100 text-sm">Total Emails</p>
              <p className="text-4xl font-bold">{stats?.total_emails || 0}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm text-pink-100 border-t border-pink-400 pt-3">
            <span>Unread: {stats?.unread_emails || 0}</span>
            <span>Read: {(stats?.total_emails || 0) - (stats?.unread_emails || 0)}</span>
          </div>
        </div>

        {/* Labels Stats */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/admin/labels')}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl opacity-80">🏷️</div>
            <div className="text-right">
              <p className="text-green-100 text-sm">Total Labels</p>
              <p className="text-4xl font-bold">{stats?.total_labels || 0}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm text-green-100 border-t border-green-400 pt-3">
            <span>System: {stats?.system_labels || 0}</span>
            <span>Pending: {stats?.pending_suggestions || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/users/create')}
            className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <div className="text-4xl group-hover:scale-110 transition-transform">➕</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Create User</p>
              <p className="text-sm text-gray-600">Add a new user to the system</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="text-4xl group-hover:scale-110 transition-transform">👥</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-600">View and edit user accounts</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/labels')}
            className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="text-4xl group-hover:scale-110 transition-transform">🏷️</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Label Approvals</p>
              <p className="text-sm text-gray-600">Review AI-suggested labels</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Alert */}
        {stats && stats.pending_suggestions > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                  Pending Label Suggestions
                </h3>
                <p className="text-yellow-800 text-sm mb-3">
                  You have <span className="font-bold">{stats.pending_suggestions}</span> label suggestions waiting for approval.
                </p>
                <button
                  onClick={() => navigate('/admin/labels')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  Review Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="text-3xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-1">
                System Information
              </h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Email classification with AI is active</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Token optimization enabled for cost savings</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>IMAP sync available for all users</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
