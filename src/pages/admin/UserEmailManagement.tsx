import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import ChatModal from '../../components/ChatModal';

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
    email_subject?: string;
    email_sender?: string;
    email_body?: string;
}

const UserEmailManagement = () => {
    const { userId } = useParams<{ userId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [emails, setEmails] = useState<Email[]>([]);
    const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [processing, setProcessing] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Get active tab from URL search params
    const activeTab = searchParams.get('tab') || 'all';
    const limit = 20;

    useEffect(() => {
        fetchUserAndData();
    }, [userId, page, activeTab]);

    const fetchUserAndData = async () => {
        try {
            setLoading(true);

            // Fetch users to find the specific user
            const userResponse = await api.get(`/admin/users`);
            const foundUser = userResponse.data.data.find((u: User) => u.id === parseInt(userId!));
            setUser(foundUser || null);

            if (activeTab === 'all') {
                // Fetch emails for this specific user
                const emailsResponse = await api.get(`/emails?userId=${userId}&page=${page}&limit=${limit}`);
                setEmails(emailsResponse.data.data || []);
                setTotal(emailsResponse.data.pagination?.total || 0);
            } else if (activeTab === 'ai') {
                // Fetch pending label suggestions for this user
                const suggestionsResponse = await api.get(`/labels/pending?userId=${userId}`);
                // The API might return { success: true, data: [...] } or just [...]
                const suggestionsData = suggestionsResponse.data?.data || suggestionsResponse.data || [];
                setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessSuggestion = async (suggestionId: number, action: 'approve' | 'reject') => {
        try {
            setProcessing(suggestionId);
            await api.post(`/labels/suggestions/${suggestionId}/process`, { action });

            toast.success(`Label ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

            // Refresh suggestions
            await fetchUserAndData();
        } catch (error: any) {
            console.error(`Failed to ${action} suggestion:`, error);
            toast.error(error.response?.data?.message || `Failed to ${action} suggestion`);
        } finally {
            setProcessing(null);
        }
    };

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
        setPage(1); // Reset pagination when switching tabs
    };

    const handleEmailClick = (email: Email | any) => {
        // If it's a suggestion, we convert it to the Email interface for the modal
        if ('email_id' in email) {
            setSelectedEmail({
                id: email.email_id,
                subject: email.email_subject || '(No Subject)',
                sender_email: email.email_sender || '',
                sender_name: '',
                body: email.email_body || '',
                received_at: email.created_at,
                is_unread: false,
                account_id: 0
            });
        } else {
            setSelectedEmail(email);
        }
    };

    const closeEmailModal = () => {
        setSelectedEmail(null);
    };

    if (loading && page === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-1">
                            {user ? `${user.name} (${user.email})` : 'User Details'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchUserAndData}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md flex items-center space-x-2"
                >
                    <span>🔄</span>
                    <span>Refresh</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => handleTabChange('all')}
                        className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'all'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All Emails {activeTab === 'all' ? `(${total})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('chat')}
                        className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'chat'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Chat with AI
                    </button>
                    <button
                        onClick={() => handleTabChange('ai')}
                        className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'ai'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        AI Suggested Labels {activeTab === 'ai' ? `(${suggestions.length})` : ''}
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {activeTab === 'all' ? (
                    /* All Emails View */
                    emails.length === 0 ? (
                        <div className="p-20 text-center">
                            <span className="text-6xl mb-4 block">📭</span>
                            <p className="text-lg font-medium text-gray-900">No emails found</p>
                            <p className="text-sm text-gray-500 mt-2">
                                This user has no emails associated with their accounts.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Body</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Received At</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {emails.map((email) => (
                                            <tr
                                                key={email.id}
                                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${email.is_unread ? 'bg-indigo-50/20' : ''}`}
                                                onClick={() => handleEmailClick(email)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {email.is_unread ? (
                                                        <span className="flex items-center text-indigo-600">
                                                            <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                                                            <span className="text-xs font-bold uppercase tracking-tighter">New</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-tighter">Read</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900 line-clamp-1">
                                                        {email.sender_name || email.sender_email}
                                                    </div>
                                                    <div className="text-xs text-gray-500 line-clamp-1">
                                                        {email.sender_email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                                        {email.body}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 font-medium">
                                                        {new Date(email.received_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(email.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleEmailClick(email)}
                                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {total > limit && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{Math.ceil(total / limit)}</span>
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page >= Math.ceil(total / limit)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                ) : activeTab === 'chat' ? (
                    <div className="p-8 text-center">
                        <div className="text-5xl mb-3">💬</div>
                        <p className="text-lg font-semibold text-gray-900">Chat with AI</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Ask questions across this user's emails and attachments.
                        </p>
                        <button
                            onClick={() => handleTabChange('chat')}
                            className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Open Chat
                        </button>
                    </div>
                ) : (
                    /* AI Suggestions View */
                    suggestions.length === 0 ? (
                        <div className="p-20 text-center">
                            <span className="text-6xl mb-4 block">✅</span>
                            <p className="text-lg font-medium text-gray-900">No pending suggestions</p>
                            <p className="text-sm text-gray-500 mt-2">
                                All AI-suggested labels for this user have been reviewed.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {suggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-all shadow-sm flex flex-col gap-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                                                    {suggestion.suggested_label_name}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {(suggestion.confidence_score * 100).toFixed(0)}% Confidence
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{suggestion.reasoning}"</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">{new Date(suggestion.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                                        onClick={() => handleEmailClick(suggestion)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-xl">📧</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{suggestion.email_subject || '(No subject)'}</p>
                                                <p className="text-xs text-gray-500 truncate">From: {suggestion.email_sender}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleProcessSuggestion(suggestion.id, 'approve')}
                                            disabled={processing === suggestion.id}
                                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {processing === suggestion.id ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            ) : '✅'}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleProcessSuggestion(suggestion.id, 'reject')}
                                            disabled={processing === suggestion.id}
                                            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {processing === suggestion.id ? (
                                                <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></span>
                                            ) : '❌'}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-gray-900 truncate">
                                    {selectedEmail.subject || '(No subject)'}
                                </h3>
                                <div className="mt-2 flex items-center text-sm text-gray-600">
                                    <span className="font-semibold text-gray-900 mr-2">From:</span>
                                    <span className="truncate">{selectedEmail.sender_name || selectedEmail.sender_email} &lt;{selectedEmail.sender_email}&gt;</span>
                                </div>
                            </div>
                            <button
                                onClick={closeEmailModal}
                                className="ml-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200 shadow-sm"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-white">
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {selectedEmail.body}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={closeEmailModal}
                                className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {activeTab === 'chat' && user && (
                <ChatModal
                    userId={user.id}
                    userName={user.name}
                    onClose={() => handleTabChange('all')}
                />
            )}
        </div>
    );
};

export default UserEmailManagement;
