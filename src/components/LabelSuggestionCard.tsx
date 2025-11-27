import { useState } from 'react';
import api from '../services/api';

interface LabelSuggestion {
    id: number;
    email_id: number;
    suggested_label_name: string;
    confidence_score: number;
    reasoning: string;
    subject: string;
    sender_email: string;
    received_at: string;
}

interface LabelSuggestionCardProps {
    suggestion: LabelSuggestion;
    onProcess: () => void;
}

const LabelSuggestionCard = ({ suggestion, onProcess }: LabelSuggestionCardProps) => {
    const [loading, setLoading] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await api.post(`/labels/suggestions/${suggestion.id}/process`, {
                action: 'approve'
            });
            onProcess();
        } catch (error: any) {
            console.error('Failed to approve suggestion:', error);
            alert(error.response?.data?.message || 'Failed to approve label suggestion');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!confirm(`Are you sure you want to reject the "${suggestion.suggested_label_name}" label for this email?`)) {
            return;
        }

        setLoading(true);
        try {
            await api.post(`/labels/suggestions/${suggestion.id}/process`, {
                action: 'reject'
            });
            onProcess();
        } catch (error: any) {
            console.error('Failed to reject suggestion:', error);
            alert(error.response?.data?.message || 'Failed to reject label suggestion');
        } finally {
            setLoading(false);
        }
    };

    const confidencePercentage = Math.round((suggestion.confidence_score || 0) * 100);
    const confidenceColor = confidencePercentage >= 80 ? 'green' : confidencePercentage >= 60 ? 'yellow' : 'orange';

    return (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                            🏷️ {suggestion.suggested_label_name}
                        </span>
                        <span className={`px-2 py-0.5 bg-${confidenceColor}-100 text-${confidenceColor}-700 rounded text-xs font-semibold`}>
                            {confidencePercentage}% confidence
                        </span>
                    </div>
                    <h4 className="text-base font-semibold text-gray-800 mb-1">
                        {suggestion.subject || '(No Subject)'}
                    </h4>
                    <p className="text-sm text-gray-600">
                        From: <span className="font-medium">{suggestion.sender_email}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {new Date(suggestion.received_at).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* AI Reasoning */}
            {suggestion.reasoning && (
                <div className="mb-4">
                    <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                        {showReasoning ? '▼' : '▶'} Why AI suggested this
                    </button>
                    {showReasoning && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 border border-blue-100">
                            {suggestion.reasoning}
                        </div>
                    )}
                </div>
            )}

            {/* Info Text */}
            <p className="text-xs text-gray-600 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                💡 <strong>Tip:</strong> Approving this label will:
                <ul className="mt-1 ml-4 list-disc">
                    <li>Create the label in your Gmail/Outlook mailbox</li>
                    <li>Apply it to this email</li>
                    <li>Automatically apply it to similar future emails</li>
                </ul>
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Processing...' : '✅ Approve & Apply'}
                </button>
                <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Processing...' : '❌ Reject'}
                </button>
            </div>
        </div>
    );
};

export default LabelSuggestionCard;
