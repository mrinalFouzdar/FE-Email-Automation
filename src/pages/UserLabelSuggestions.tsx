import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

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

interface User {
    id: number;
    name: string;
    email: string;
}

const UserLabelSuggestions = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);

    useEffect(() => {
        fetchUserAndSuggestions();
    }, [userId]);

    const fetchUserAndSuggestions = async () => {
        try {
            setLoading(true);

            // Fetch user details
            const userResponse = await api.get(`/admin/users`);
            const foundUser = userResponse.data.data.find((u: User) => u.id === parseInt(userId!));
            setUser(foundUser || null);

            // Fetch suggestions for this user
            const suggestionsResponse = await api.get(`/labels/pending?userId=${userId}`);
            console.log('Suggestions API Response:', suggestionsResponse);
            console.log('Response data:', suggestionsResponse.data);
            const suggestionsData = suggestionsResponse.data?.data || suggestionsResponse.data || [];
            console.log('Extracted suggestions:', suggestionsData);
            console.log('Is array?', Array.isArray(suggestionsData));
            setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load suggestions');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (suggestionId: number, action: 'approve' | 'reject') => {
        try {
            setProcessing(suggestionId);
            await api.post(`/labels/suggestions/${suggestionId}/process`, { action });

            toast.success(`Label ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

            // Refresh suggestions
            await fetchUserAndSuggestions();
        } catch (error: any) {
            console.error(`Failed to ${action} suggestion:`, error);
            toast.error(error.response?.data?.message || `Failed to ${action} suggestion`);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-slate-400">Loading suggestions...</p>
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
                                <h1 className="text-xl font-bold text-white">AI Label Suggestions</h1>
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
                {suggestions.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
                        <span className="text-6xl mb-4 block">✅</span>
                        <p className="text-lg font-medium text-white">No pending suggestions</p>
                        <p className="text-sm text-slate-400 mt-2">
                            All AI-suggested labels for this user have been reviewed
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {suggestions.length} Pending Suggestion{suggestions.length !== 1 ? 's' : ''}
                            </h2>
                            <button
                                onClick={fetchUserAndSuggestions}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {Array.isArray(suggestions) && suggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-bold border border-purple-500/30">
                                                {suggestion.suggested_label_name}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Confidence: {(suggestion.confidence_score * 100).toFixed(0)}%
                                            </span>
                                            <span className="text-xs text-slate-500 capitalize">
                                                via {suggestion.suggested_by}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 italic">"{suggestion.reasoning}"</p>
                                    </div>
                                </div>

                                {/* Email Preview */}
                                <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/50">
                                    <div className="flex items-start gap-3 mb-2">
                                        <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {suggestion.email_subject || 'No subject'}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">
                                                From: {suggestion.email_sender || 'Unknown'}
                                            </p>
                                            {suggestion.email_body && (
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                                    {suggestion.email_body.substring(0, 150)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleProcess(suggestion.id, 'approve')}
                                        disabled={processing === suggestion.id}
                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing === suggestion.id ? '⏳ Processing...' : '✅ Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleProcess(suggestion.id, 'reject')}
                                        disabled={processing === suggestion.id}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing === suggestion.id ? '⏳ Processing...' : '❌ Reject'}
                                    </button>
                                </div>

                                <p className="text-xs text-slate-500 mt-3">
                                    Suggested on {new Date(suggestion.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserLabelSuggestions;
