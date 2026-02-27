import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface Email {
    id: number;
    subject: string;
    sender_email: string;
    sender_name: string;
    body: string;
    received_at: string;
    is_unread: boolean;
    account_id: number;
    user_name?: string;
}

const AllEmailsPage = () => {
    const navigate = useNavigate();
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<'all'>('all');
    const limit = 20;

    useEffect(() => {
        fetchAllEmails();
    }, [page]);

    const fetchAllEmails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/emails?page=${page}&limit=${limit}`);
            setEmails(response.data.data || []);
            setTotal(response.data.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch emails:', error);
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

    if (loading && page === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading system emails...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Email Explorer</h1>
                <p className="text-gray-600 mt-1">Monitor all emails across the system</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All Emails
                    </button>
                    {/* Future tabs can be added here */}
                </nav>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {emails.length === 0 ? (
                    <div className="p-20 text-center">
                        <span className="text-6xl mb-4 block">📭</span>
                        <p className="text-lg font-medium text-gray-900">No emails found</p>
                        <p className="text-sm text-gray-500 mt-2">
                            The system has not captured any emails yet.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received At</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {emails.map((email) => (
                                        <tr
                                            key={email.id}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${email.is_unread ? 'bg-indigo-50/30' : ''}`}
                                            onClick={() => handleEmailClick(email)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {email.is_unread ? (
                                                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block" title="Unread"></span>
                                                ) : (
                                                    <span className="w-2.5 h-2.5 bg-gray-300 rounded-full inline-block" title="Read"></span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                    {email.subject || '(No Subject)'}
                                                </div>
                                                <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                    {email.body?.substring(0, 80)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">{email.sender_name || email.sender_email}</div>
                                                <div className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    User: {email.user_name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(email.received_at).toLocaleDateString()}
                                                <span className="block text-xs opacity-60">
                                                    {new Date(email.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleEmailClick(email)}
                                                    className="text-indigo-600 hover:text-indigo-900 px-3 py-1 bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    View Details
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
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                                    <span className="font-medium">{total}</span> emails
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= Math.ceil(total / limit)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white sticky top-0">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                    {selectedEmail.subject || '(No subject)'}
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-4 items-center text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <span className="font-semibold text-gray-900 mr-1">From:</span>
                                        {selectedEmail.sender_name || selectedEmail.sender_email}
                                        {selectedEmail.sender_name && <span className="text-gray-400 ml-1">&lt;{selectedEmail.sender_email}&gt;</span>}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-semibold text-gray-900 mr-1">Date:</span>
                                        {new Date(selectedEmail.received_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={closeEmailModal}
                                className="ml-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <div className="prose prose-indigo max-w-none">
                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                                    {selectedEmail.body}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={closeEmailModal}
                                className="px-6 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllEmailsPage;
