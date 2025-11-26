import { useState, useEffect } from 'react';
import api from './services/api';
import EmailAccountManager from './components/EmailAccountManager';
import LoginPage from './pages/LoginPage';

const API_URL = 'http://localhost:4000/api';

interface EmailMeta {
  is_hierarchy: boolean;
  is_client: boolean;
  is_meeting: boolean;
  is_escalation: boolean;
  is_urgent: boolean;
  is_mom: boolean;
}

interface Email {
  id: number;
  gmail_id: string;
  thread_id?: string;
  subject: string;
  sender_email: string;
  to_recipients: string[];
  cc_recipients: string[];
  recipients: string[];
  body: string;
  is_unread: boolean;
  labels: string[];
  received_at: string;
  created_at: string;
  account_id?: number;
  meta?: EmailMeta;
}

interface Reminder {
  id: number;
  email_id: number;
  reminder_text: string;
  reason: string;
  priority: number;
  subject: string;
  sender_email: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'emails' | 'accounts'>('accounts');
  const [emails, setEmails] = useState<Email[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      return true;
    }

    setIsAuthenticated(false);
    setUser(null);
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [emailsRes, remindersRes] = await Promise.all([
        api.get(`${API_URL}/emails`),
        api.get(`${API_URL}/reminders`)
      ]);

      const emailsWithMeta = await Promise.all(
        emailsRes.data.map(async (email: Email) => {
          try {
            const metaRes = await api.get(`${API_URL}/emails/${email.id}/meta`);
            return { ...email, meta: metaRes.data };
          } catch {
            return email;
          }
        })
      );

      setEmails(emailsWithMeta);
      setReminders(remindersRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkAuth()) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const resolveReminder = async (id: number) => {
    try {
      await api.post(`${API_URL}/reminders/${id}/resolve`);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to resolve reminder:', err);
    }
  };

  const uniqueLabels = Array.from(new Set(emails.flatMap(e => e.labels || []))).sort();

  const stats = {
    total: emails.length,
    unread: emails.filter(e => e.is_unread).length,
    hierarchy: emails.filter(e => e.meta?.is_hierarchy).length,
    client: emails.filter(e => e.meta?.is_client).length,
    meetings: emails.filter(e => e.meta?.is_meeting).length,
    urgent: emails.filter(e => e.meta?.is_urgent).length
  };

  const renderEmailLabels = (email: Email) => {
    const labels = [];

    // Render AI-generated text labels
    if (email.labels && email.labels.length > 0) {
      email.labels.forEach(label => {
        labels.push(
          <span key={`label-${label}`} className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-200 text-gray-700 shadow-sm border border-gray-300">
            {label}
          </span>
        );
      });
    }

    if (email.is_unread) {
      labels.push(
        <span key="unread" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-md">
          Unread
        </span>
      );
    }
    if (email.meta?.is_hierarchy) {
      labels.push(
        <span key="hierarchy" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md">
          Hierarchy
        </span>
      );
    }
    if (email.meta?.is_client) {
      labels.push(
        <span key="client" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-md">
          Client
        </span>
      );
    }
    if (email.meta?.is_meeting) {
      labels.push(
        <span key="meeting" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md">
          Meeting
        </span>
      );
    }
    if (email.meta?.is_escalation) {
      labels.push(
        <span key="escalation" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-red-400 to-red-600 text-white shadow-md">
          Escalation
        </span>
      );
    }
    if (email.meta?.is_urgent) {
      labels.push(
        <span key="urgent" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-pink-400 to-pink-600 text-white shadow-md">
          Urgent
        </span>
      );
    }
    if (email.meta?.is_mom) {
      labels.push(
        <span key="mom" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md">
          MoM
        </span>
      );
    }

    return labels;
  };

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true;
    if (filter === 'unread') return email.is_unread;
    if (filter === 'hierarchy') return email.meta?.is_hierarchy;
    if (filter === 'client') return email.meta?.is_client;
    if (filter === 'meeting') return email.meta?.is_meeting;
    if (filter === 'escalation') return email.meta?.is_escalation;
    if (filter === 'urgent') return email.meta?.is_urgent;
    // Check if filter matches one of the labels
    if (email.labels && email.labels.includes(filter)) return true;
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading email data...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6">
      <div className="max-w-7xl mx-auto px-5">
        <div className="card mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-3 flex items-center gap-4">
                <span className="text-6xl drop-shadow-lg">📧</span> Email RAG System
              </h1>
              <p className="text-blue-100 text-lg font-medium">Smart Email Management with AI-Powered Insights & Analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-blue-100/70">Welcome,</p>
                <p className="font-bold">{user?.name || user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className={`px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 transform ${activeTab === 'accounts'
                ? 'bg-white text-blue-600 shadow-2xl scale-105'
                : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 backdrop-blur-sm'
                }`}
              onClick={() => setActiveTab('accounts')}
            >
              <span className="mr-2 text-xl">📧</span> Email Accounts
            </button>
            <button
              className={`px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 transform ${activeTab === 'emails'
                ? 'bg-white text-purple-600 shadow-2xl scale-105'
                : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 backdrop-blur-sm'
                }`}
              onClick={() => setActiveTab('emails')}
            >
              <span className="mr-2 text-xl">📬</span> Emails & Reminders
            </button>
          </div>
        </div>

        {error && (
          <div className="card mb-6 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-lg">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && <EmailAccountManager />}

        {activeTab === 'emails' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="card max-h-[600px] overflow-y-auto bg-gradient-to-br from-white to-red-50">
                <h2 className="text-2xl font-bold mb-5 text-red-600 flex items-center gap-3">
                  <span className="text-3xl">🔔</span> Active Reminders
                  <span className="ml-auto bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">{reminders.length}</span>
                </h2>
                {reminders.length === 0 ? (
                  <div className="text-center py-20 px-5 text-gray-400">
                    <span className="text-6xl mb-4 block">✅</span>
                    <p className="text-lg font-medium">No active reminders</p>
                  </div>
                ) : (
                  reminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className={`mb-4 p-4 rounded-xl border-l-4 shadow-lg transition-all hover:shadow-xl ${reminder.priority === 10 ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-600' :
                        reminder.priority === 9 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-600' :
                          'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-600'
                        }`}
                    >
                      <div className="font-semibold mb-2 text-gray-800">{reminder.reminder_text}</div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span className="font-medium">Priority: {reminder.priority}</span>
                        <button
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                          onClick={() => resolveReminder(reminder.id)}
                        >
                          ✓ Resolve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="lg:col-span-2 card bg-gradient-to-br from-white to-blue-50">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 flex items-center gap-3">
                  <span className="text-3xl">📊</span> Email Statistics
                </h2>
                <div className="grid grid-cols-3 gap-5">
                  {[
                    { label: 'Total Emails', value: stats.total, gradient: 'from-gray-400 to-gray-600', icon: '📧' },
                    { label: 'Unread', value: stats.unread, gradient: 'from-sky-400 to-sky-600', icon: '✉️' },
                    { label: 'Hierarchy', value: stats.hierarchy, gradient: 'from-green-400 to-green-600', icon: '👔' },
                    { label: 'Client', value: stats.client, gradient: 'from-blue-400 to-blue-600', icon: '🤝' },
                    { label: 'Meetings', value: stats.meetings, gradient: 'from-orange-400 to-orange-600', icon: '📅' },
                    { label: 'Urgent', value: stats.urgent, gradient: 'from-pink-400 to-pink-600', icon: '⚡' },
                  ].map((stat, idx) => (
                    <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
                      <div className="text-4xl mb-2">{stat.icon}</div>
                      <div className="text-4xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm font-semibold opacity-90">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-white to-purple-50">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-3xl">📬</span> All Emails
                </h2>
                <button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  onClick={fetchData}
                >
                  🔄 Refresh Data
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { key: 'all', label: `All (${emails.length})`, color: 'blue' },
                  { key: 'unread', label: `Unread (${stats.unread})`, color: 'sky' },
                  { key: 'hierarchy', label: `Hierarchy (${stats.hierarchy})`, color: 'green' },
                  { key: 'client', label: `Client (${stats.client})`, color: 'blue' },
                  { key: 'meeting', label: `Meetings (${stats.meetings})`, color: 'orange' },
                  { key: 'urgent', label: `Urgent (${stats.urgent})`, color: 'pink' },
                  { key: 'escalation', label: 'Escalation', color: 'red' },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    className={`px-5 py-2.5 border-2 rounded-full font-bold transition-all transform hover:scale-105 ${filter === btn.key
                      ? `bg-gradient-to-r from-${btn.color}-500 to-${btn.color}-600 text-white border-${btn.color}-600 shadow-lg`
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                      }`}
                    onClick={() => setFilter(btn.key)}
                  >
                    {btn.label}
                  </button>
                ))}

                {/* Dynamic Labels */}
                {uniqueLabels.length > 0 && (
                  <>
                    <div className="w-full h-px bg-gray-200 my-2"></div>
                    <div className="w-full text-sm font-bold text-gray-500 mb-2">AI Labels:</div>
                    {uniqueLabels.map(label => (
                      <button
                        key={label}
                        className={`px-4 py-1.5 border rounded-full text-sm font-semibold transition-all transform hover:scale-105 ${filter === label
                          ? 'bg-gray-800 text-white border-gray-800 shadow-lg'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                        onClick={() => setFilter(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-20 px-5 text-gray-400">
                    <span className="text-6xl mb-4 block">📭</span>
                    <p className="text-xl font-medium">No emails found</p>
                  </div>
                ) : (
                  filteredEmails.map(email => (
                    <div
                      key={email.id}
                      className={`border-2 rounded-xl p-5 transition-all cursor-pointer hover:shadow-2xl transform hover:-translate-y-1 ${email.is_unread
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-base text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">👤</span> {email.sender_email}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          {new Date(email.received_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-lg text-gray-800 mb-3 font-bold">{email.subject}</div>
                      <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {email.body}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {renderEmailLabels(email)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
