import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { meetingService, Meeting, MomDraft, ComplianceStats } from '../../services/meeting.service';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    scheduled: { label: '📅 Scheduled', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: '🚫 Cancelled', color: 'bg-gray-100 text-gray-500' },
    done: { label: '✅ Done', color: 'bg-green-100 text-green-700' },
    mom_received: { label: '📋 MOM Received', color: 'bg-emerald-100 text-emerald-700' },
    awaiting_reply: { label: '💬 Awaiting Reply', color: 'bg-amber-100 text-amber-700' },
    mom_missing: { label: '⚠️ MOM Missing', color: 'bg-red-100 text-red-700' },
    closed: { label: '🔒 Closed', color: 'bg-purple-100 text-purple-700' },
};

const MeetingDashboard = () => {
    const [searchParams] = useSearchParams();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [momDraft, setMomDraft] = useState<MomDraft | null>(null);
    const [draftLoading, setDraftLoading] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    // New states for user-driven flow
    const [userInput, setUserInput] = useState('');
    const [refining, setRefining] = useState(false);
    const [sending, setSending] = useState(false);
    const [editableContent, setEditableContent] = useState('');

    const isDetectedAfterMeetingEnd = (meeting: Meeting) => {
        const meetingEndReference = meeting.meeting_end_at || meeting.scheduled_at;
        if (!meetingEndReference || !meeting.created_at) return false;

        const meetingEnd = new Date(meetingEndReference);
        const detectedAt = new Date(meeting.created_at);
        if (Number.isNaN(meetingEnd.getTime()) || Number.isNaN(detectedAt.getTime())) return false;

        return detectedAt > meetingEnd;
    };

    const getDisplayStatus = (meeting: Meeting): Meeting['status'] => {
        // Late sync case: meeting already ended by the time we detected it.
        // Keep backend status untouched, but avoid showing "Scheduled" in UI.
        if (meeting.status === 'scheduled' && isDetectedAfterMeetingEnd(meeting)) {
            return 'done';
        }
        return meeting.status;
    };

    const isMomMissingForMeeting = (meeting: Meeting) => {
        if (meeting.status === 'mom_missing') return true;
        if (meeting.status !== 'scheduled') return false;

        return isDetectedAfterMeetingEnd(meeting);
    };

    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            const [meetingRes, statsRes] = await Promise.all([
                meetingService.getMeetings(undefined, filter),
                meetingService.getComplianceStats()
            ]);

            const data: Meeting[] = meetingRes.data.data || [];
            setMeetings(data);
            setStats(statsRes.data.data || null);

            const meetingIdParam = searchParams.get('meetingId');
            if (meetingIdParam) {
                const found = data.find(m => m.id === parseInt(meetingIdParam));
                if (found) setSelectedMeeting(found);
            }
        } catch {
            toast.error('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    }, [searchParams, filter]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    useEffect(() => {
        if (!selectedMeeting) {
            setMomDraft(null);
            return;
        }
        // Only fetch draft if it's relevant
        if (['scheduled', 'mom_missing', 'done', 'mom_received', 'awaiting_reply'].includes(selectedMeeting.status)) {
            fetchMomDraft(selectedMeeting.id);
        } else {
            setMomDraft(null);
        }
    }, [selectedMeeting]);

    const fetchMomDraft = async (meetingId: number) => {
        try {
            setDraftLoading(true);
            const res = await meetingService.getMomDraft(meetingId);
            const draft = res.data.data;
            setMomDraft(draft || null);
            if (draft && draft.final_content) {
                setEditableContent(draft.final_content);
            } else if (draft && draft.content) {
                setEditableContent(draft.content);
            } else {
                setEditableContent('');
            }
        } catch {
            setMomDraft(null);
            setEditableContent('');
        } finally {
            setDraftLoading(false);
        }
    };

    const handleRefine = async () => {
        if (!selectedMeeting || !userInput.trim()) return;
        try {
            setRefining(true);
            const res = await meetingService.refineMomDraft(selectedMeeting.id, userInput);
            setMomDraft(res.data.data);
            setEditableContent(res.data.data.final_content || res.data.data.content || '');
            setUserInput(''); // Clear input after successful refinement
            toast.success('✨ AI refinement complete');
        } catch {
            toast.error('Failed to refine notes');
        } finally {
            setRefining(false);
        }
    };

    const handleApproveAndSend = async () => {
        if (!selectedMeeting || !momDraft) return;
        try {
            setSending(true);
            // First save any local edits to the backend
            if (editableContent !== momDraft.final_content) {
                await meetingService.updateDraftContent(selectedMeeting.id, momDraft.id, editableContent);
            }
            // Then trigger send
            await meetingService.sendMomEmail(selectedMeeting.id, momDraft.id);
            toast.success('MOM Email Sent Successfully!');
            fetchMomDraft(selectedMeeting.id);
            fetchMeetings(); // Refresh list to update status
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send MOM email');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (meeting: Meeting, status: string) => {
        try {
            await meetingService.updateMeetingStatus(meeting.id, status);
            toast.success('Meeting status updated');
            setSelectedMeeting(prev => prev ? { ...prev, status } as any : null);
            fetchMeetings();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDraftAction = async (action: 'approved' | 'discarded') => {
        if (!momDraft || !selectedMeeting) return;
        try {
            await meetingService.updateDraftStatus(selectedMeeting.id, momDraft.id, action);
            toast.success(action === 'approved' ? '✅ Draft approved' : '🗑️ Draft discarded');
            fetchMomDraft(selectedMeeting.id);
        } catch {
            toast.error('Failed to update draft');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500">Loading meetings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meeting Tracker</h1>
                    <p className="text-gray-500 mt-1">Monitor meetings, MOM status, and auto-generated drafts</p>
                </div>
                <div className="flex gap-2 text-[10px] flex-wrap justify-end max-w-md">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <span key={key} className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cfg.color}`}>
                            {cfg.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Compliance Stats Overview ──────────────────────────────── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MOM Compliance</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-indigo-600">{stats.compliance_rate}%</span>
                            <span className="text-xs text-gray-400">Target: 100%</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Meetings</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-gray-800">{stats.total_meetings}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">{stats.mom_received_count} MOMs</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. MOM Delay</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-amber-600">{stats.avg_mom_delay_hours}h</span>
                            <span className="text-[10px] text-gray-400">per meeting</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cancellations</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-red-400">{stats.cancelled_count}</span>
                            <span className="text-[10px] text-gray-400">Total</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Meeting List ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-gray-800">Meetings</h2>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="text-xs border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1"
                            >
                                <option value="all">All Meetings</option>
                                <option value="scheduled">Upcoming</option>
                                <option value="mom_pending">MOM Pending (Overdue)</option>
                                <option value="mom_complete">MOM Complete</option>
                            </select>
                        </div>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {meetings.length} Total
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                        {meetings.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <div className="text-5xl mb-4">📅</div>
                                <p>No meetings detected yet.</p>
                            </div>
                        ) : (
                            meetings.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMeeting(m)}
                                    className={`p-4 cursor-pointer transition-all hover:bg-indigo-50 ${selectedMeeting?.id === m.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{m.subject}</p>
                                            <div className="flex gap-2 items-center mt-1">
                                                {m.project_name && (
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase">📁 {m.project_name}</p>
                                                )}
                                                <p className="text-[10px] text-gray-400 capitalize">
                                                    {new Date(m.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </p>
                                                {isMomMissingForMeeting(m) && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                                        ⚠️ MOM MISSING
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase ${STATUS_CONFIG[getDisplayStatus(m)]?.color}`}>
                                            {STATUS_CONFIG[getDisplayStatus(m)]?.label}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Detail Panel ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {!selectedMeeting ? (
                        <div className="flex flex-col items-center justify-center h-full p-12 text-center text-gray-400">
                            <div className="text-5xl mb-4">👈</div>
                            <p className="text-lg">Select a meeting to view details</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-5 bg-gray-50 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedMeeting.subject}</h2>
                                <div className="flex gap-3 mt-3 flex-wrap">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${STATUS_CONFIG[getDisplayStatus(selectedMeeting)]?.color}`}>
                                        {STATUS_CONFIG[getDisplayStatus(selectedMeeting)]?.label}
                                    </span>
                                    {selectedMeeting.project_name && (
                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase">
                                            📁 {selectedMeeting.project_name}
                                        </span>
                                    )}
                                    {isMomMissingForMeeting(selectedMeeting) && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold animate-pulse border border-red-200">
                                            ⚠️ MOM MISSING (OVERDUE)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 flex-1 space-y-5 overflow-y-auto">
                                {/* Timeline Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-indigo-50 rounded-xl col-span-2">
                                        <p className="text-[9px] font-bold text-indigo-400 uppercase">Meeting Schedule</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                            {selectedMeeting.scheduled_at ? (
                                                <>
                                                    📅 {new Date(selectedMeeting.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {selectedMeeting.meeting_end_at && (
                                                        <> - {new Date(selectedMeeting.meeting_end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                                    )}
                                                    <span className="ml-2 text-[10px] text-gray-400 font-normal">
                                                        ({new Date(selectedMeeting.scheduled_at).toLocaleDateString([], { day: 'numeric', month: 'short' })})
                                                    </span>
                                                </>
                                            ) : (
                                                'Time not detected'
                                            )}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Detected At</p>
                                        <p className="text-xs font-semibold text-gray-700">
                                            {new Date(selectedMeeting.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    {selectedMeeting.mom_received_at && (
                                        <div className="p-3 bg-emerald-50 rounded-xl">
                                            <p className="text-[9px] font-bold text-emerald-400 uppercase">MOM Received</p>
                                            <p className="text-xs font-semibold text-emerald-700">
                                                {new Date(selectedMeeting.mom_received_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {selectedMeeting.last_reply_at && (
                                        <div className="p-3 bg-amber-50 rounded-xl">
                                            <p className="text-[9px] font-bold text-amber-400 uppercase">Last Client Reply</p>
                                            <p className="text-xs font-semibold text-amber-700">
                                                {new Date(selectedMeeting.last_reply_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {selectedMeeting.status === 'closed' && (
                                        <div className="p-3 bg-purple-50 rounded-xl col-span-2">
                                            <p className="text-[9px] font-bold text-purple-400 uppercase">Meeting Status</p>
                                            <p className="text-xs font-semibold text-purple-700">
                                                ✅ This flow is completed and closed.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Status Override */}
                                {/* {selectedMeeting.status !== 'closed' && selectedMeeting.status !== 'cancelled' && (
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Status</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['scheduled', 'mom_missing', 'mom_received', 'awaiting_reply', 'done', 'closed', 'cancelled'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(selectedMeeting, s)}
                                                    disabled={selectedMeeting.status === s}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase ${selectedMeeting.status === s
                                                        ? 'bg-indigo-600 text-white cursor-default'
                                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {STATUS_CONFIG[s]?.label.split(' ')[1] || STATUS_CONFIG[s]?.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )} */}

                                {/* MOM Draft Section */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        MOM Processing
                                    </p>

                                    {draftLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-400 p-4">
                                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            Checking for draft...
                                        </div>
                                    ) : isMomMissingForMeeting(selectedMeeting) && (!momDraft || momDraft.status === 'discarded') ? (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl overflow-hidden p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="text-sm">📝</span>
                                                <span className="text-xs font-bold text-indigo-800">
                                                    Submit Your Missing Notes
                                                </span>
                                            </div>
                                            <textarea
                                                className="w-full text-sm p-3 border border-indigo-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 mb-3 min-h-[100px]"
                                                placeholder="Enter meeting notes as bullet points..."
                                                value={userInput}
                                                onChange={(e) => setUserInput(e.target.value)}
                                                disabled={refining}
                                            />
                                            <button
                                                onClick={handleRefine}
                                                disabled={refining || !userInput.trim()}
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2"
                                            >
                                                {refining ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Refining...
                                                    </>
                                                ) : 'Refine with AI ✨'}
                                            </button>
                                        </div>
                                    ) : momDraft ? (
                                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="p-3 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">✨</span>
                                                    <span className="text-xs font-bold text-gray-800">
                                                        {momDraft.draft_type === 'user_refined' ? 'AI-Refined MOM Email' : `Draft by ${momDraft.generated_by}`}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${momDraft.status === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                                                    momDraft.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {momDraft.status === 'pending_review' ? '⏳ Review Needed' :
                                                        momDraft.status === 'approved' ? '✅ Sent/Approved' : '🗑️ Discarded'}
                                                </span>
                                            </div>

                                            {momDraft.status === 'pending_review' ? (
                                                <div className="p-4 bg-white">
                                                    <textarea
                                                        className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-xl min-h-[250px] font-mono whitespace-pre-wrap leading-relaxed focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                                                        value={editableContent}
                                                        onChange={(e) => setEditableContent(e.target.value)}
                                                        disabled={sending}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleApproveAndSend}
                                                            disabled={sending}
                                                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-2"
                                                        >
                                                            {sending ? (
                                                                <>
                                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    Sending...
                                                                </>
                                                            ) : '✅ Approve & Send to Participants'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDraftAction('discarded')}
                                                            disabled={sending}
                                                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all"
                                                        >
                                                            🗑️ Discard
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <pre className="p-4 text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto bg-white">
                                                    {momDraft.final_content || momDraft.content}
                                                </pre>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">
                                            <div className="text-3xl mb-2">📭</div>
                                            <p className="text-xs">
                                                {selectedMeeting.status === 'closed'
                                                    ? 'Meeting is closed.'
                                                    : selectedMeeting.status === 'cancelled'
                                                        ? 'Meeting was cancelled.'
                                                        : 'No drafts created yet.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default MeetingDashboard;
