import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService, MeetingNotification } from '../../services/meeting.service';

const TYPE_ICON: Record<string, string> = {
    mom_missing: '⚠️',
    client_replied: '💬',
    mom_draft_ready: '📝',
};

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<MeetingNotification[]>([]);
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await meetingService.getUnreadNotifications();
            setNotifications(res.data.data.notifications || []);
            setCount(res.data.data.count || 0);
        } catch {
            // silently fail — not critical
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id: number) => {
        await meetingService.markNotificationRead(id);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        await meetingService.markAllRead();
        fetchNotifications();
    };

    const handleNotificationClick = async (n: MeetingNotification) => {
        await handleMarkRead(n.id);
        navigate(`/admin/meetings?meetingId=${n.meeting_id}`);
        setOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Notifications"
            >
                <span className="text-xl">🔔</span>
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                        {count > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-white/80 hover:text-white text-xs underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">
                                <div className="text-3xl mb-2">✅</div>
                                <p className="text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                                            className="text-gray-300 hover:text-gray-500 text-xs mt-0.5"
                                            title="Dismiss"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button
                            onClick={() => { navigate('/admin/meetings'); setOpen(false); }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                            View Meetings Dashboard →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
