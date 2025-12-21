import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

interface Email {
    id: number;
    subject: string;
    sender_email: string;
    sender_name: string;
    body: string;
    received_at: string;
    is_unread: boolean;
    account_id: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface PendingSuggestion {
    id: number;
    email_id: number;
    suggested_label_name: string;
    confidence_score: number;
    reasoning: string;
    suggested_by: string;
    status: string;
    created_at: string;
}

const UserEmails = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [emails, setEmails] = useState<Email[]>([]);
    const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [processing, setProcessing] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        fetchUserAndEmails();
    }, [userId, page]);

    const fetchUserAndEmails = async () => {
        try {
            setLoading(true);

            // Fetch user details
            const userResponse = await api.get(`/admin/users`);
            const foundUser = userResponse.data.data.find((u: User) => u.id === parseInt(userId!));
            setUser(foundUser || null);

            // Fetch emails for this user
            const emailsResponse = await api.get(`/emails?userId=${userId}&page=${page}&limit=${limit}`);
            setEmails(emailsResponse.data.data || []);
            setTotal(emailsResponse.data.pagination?.total || 0);

            // Fetch pending label suggestions for this user
            const suggestionsResponse = await api.get(`/labels/pending?userId=${userId}`);
            const suggestionsData = suggestionsResponse.data?.data || suggestionsResponse.data || [];
            setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load emails');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
    };

    const closeEmailModal = () => {
        setSelectedEmail(null);
    };

    const handleProcessSuggestion = async (suggestionId: number, action: 'approve' | 'reject', event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent email modal from opening
        try {
            setProcessing(suggestionId);
            await api.post(`/labels/suggestions/${suggestionId}/process`, { action });

            toast.success(`Label ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

            // Refresh data
            await fetchUserAndEmails();
        } catch (error: any) {
            console.error(`Failed to ${action} suggestion:`, error);
            toast.error(error.response?.data?.message || `Failed to ${action} suggestion`);
        } finally {
            setProcessing(null);
        }
    };

    // Helper function to get suggestions for a specific email
    const getSuggestionsForEmail = (emailId: number) => {
        return suggestions.filter(s => s.email_id === emailId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-slate-400">Loading emails...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate('/admin')}
                                className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-white">User Emails</h1>
                                <p className="text-sm text-slate-400">
                                    {user ? `${user.name} (${user.email})` : 'User'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {emails.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
                        <span className="text-6xl mb-4 block">📭</span>
                        <p className="text-lg font-medium text-white">No emails found</p>
                        <p className="text-sm text-slate-400 mt-2">
                            This user has no emails yet
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {total} Email{total !== 1 ? 's' : ''}
                            </h2>
                            <button
                                onClick={fetchUserAndEmails}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {/* Email List */}
                        <div className="space-y-3">
                            {emails.map((email) => {
                                const emailSuggestions = getSuggestionsForEmail(email.id);
                                return (
                                    <div
                                        key={email.id}
                                        className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition ${email.is_unread ? 'bg-blue-900/10 border-blue-500/30' : ''
                                            }`}
                                    >
                                        {/* Email Content */}
                                        <div
                                            onClick={() => handleEmailClick(email)}
                                            className="p-5 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {email.is_unread && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                        )}
                                                        <p className="text-sm font-semibold text-white truncate">
                                                            {email.subject || '(No subject)'}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mb-1">
                                                        From: {email.sender_name || email.sender_email}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {email.body?.substring(0, 150)}...
                                                    </p>
                                                </div>
                                                <div className="ml-4 text-right flex-shrink-0">
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(email.received_at).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-slate-600">
                                                        {new Date(email.received_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Label Suggestions */}
                                        {emailSuggestions.length > 0 && (
                                            <div className="border-t border-slate-700/50 p-4 bg-purple-900/10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-purple-400 text-xs font-bold">🤖 AI LABEL SUGGESTIONS</span>
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
                                                        {emailSuggestions.length}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {emailSuggestions.map((suggestion) => (
                                                        <div
                                                            key={suggestion.id}
                                                            className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50"
                                                        >
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-bold border border-purple-500/30">
                                                                            {suggestion.suggested_label_name}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">
                                                                            {(suggestion.confidence_score * 100).toFixed(0)}% confidence
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 italic">"{suggestion.reasoning}"</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => handleProcessSuggestion(suggestion.id, 'approve', e)}
                                                                    disabled={processing === suggestion.id}
                                                                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {processing === suggestion.id ? '⏳' : '✅'} Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleProcessSuggestion(suggestion.id, 'reject', e)}
                                                                    disabled={processing === suggestion.id}
                                                                    className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {processing === suggestion.id ? '⏳' : '❌'} Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {total > limit && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Previous
                                </button>
                                <span className="px-4 py-2 bg-slate-800 text-white rounded-lg">
                                    Page {page} of {Math.ceil(total / limit)}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= Math.ceil(total / limit)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {selectedEmail.subject || '(No subject)'}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        From: {selectedEmail.sender_name || selectedEmail.sender_email}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(selectedEmail.received_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={closeEmailModal}
                                    className="text-slate-400 hover:text-white ml-4"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="prose prose-invert max-w-none">
                                <p className="text-slate-300 whitespace-pre-wrap">
                                    {selectedEmail.body}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserEmails;
