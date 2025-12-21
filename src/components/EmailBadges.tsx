import { FC } from 'react';
import { Email } from '../types/email.types';

interface EmailBadgesProps {
    email: Email;
}

const EmailBadges: FC<EmailBadgesProps> = ({ email }) => {
    const labels = [];

    // Render AI-generated text labels
    if (email.labels && email.labels.length > 0) {
        email.labels.forEach((label) => {
            // Don't render system labels here if we handle them specifically below, 
            // but the original code included both specific badges AND generic labels if they matched.
            // However, usually `labels` array from backend might contain 'escalation' string.
            // We will follow the original logic: render all string labels first.
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

    return <>{labels}</>;
};

export default EmailBadges;
