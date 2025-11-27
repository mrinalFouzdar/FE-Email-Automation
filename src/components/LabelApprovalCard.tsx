import { useState } from 'react';
import api from '../services/api';

interface LabelApprovalCardProps {
    label: {
        id: number;
        name: string;
        color: string;
        email_count: number;
    };
    onApprove: () => void;
    onReject: () => void;
}

const LabelApprovalCard = ({ label, onApprove, onReject }: LabelApprovalCardProps) => {
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await api.post('/labels/approve', { label_id: label.id });
            onApprove();
        } catch (error) {
            console.error('Failed to approve label:', error);
            alert('Failed to approve label');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!confirm(`Are you sure you want to reject label "${label.name}"? This will remove it from all emails.`)) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/labels/reject', { label_id: label.id });
            onReject();
        } catch (error) {
            console.error('Failed to reject label:', error);
            alert('Failed to reject label');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                    ></div>
                    <h3 className="text-lg font-bold text-gray-800">{label.name}</h3>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                    {label.email_count} emails
                </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                AI suggested this label for {label.email_count} email{label.email_count !== 1 ? 's' : ''}.
                Approve to sync to Gmail/Outlook.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Processing...' : '✓ Approve'}
                </button>
                <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Processing...' : '✗ Reject'}
                </button>
            </div>
        </div>
    );
};

export default LabelApprovalCard;
