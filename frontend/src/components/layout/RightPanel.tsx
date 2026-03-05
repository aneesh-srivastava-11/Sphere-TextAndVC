'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useCallStore } from '@/stores/callStore';
import { api } from '@/lib/api';
import { Account, Message } from '@/types';
import {
    Users, Pin, Paperclip, Phone, PhoneOff, Shield, UserMinus, Ban,
    VolumeX, Flag, ChevronDown, ChevronRight, X, Hash, AlertTriangle,
} from 'lucide-react';

export default function RightPanel() {
    const { user } = useAuthStore();
    const { activeConversation } = useConversationStore();
    const { activeCall, isInCall } = useCallStore();

    const [activeTab, setActiveTab] = useState<'members' | 'pinned' | 'files'>('members');
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [showModActions, setShowModActions] = useState<string | null>(null);

    const participants = activeConversation?.participants || [];
    const userRole = participants.find((p: Account) => p.id === user?.id)?.role;
    const isModerator = userRole === 'owner' || userRole === 'moderator';

    useEffect(() => {
        if (activeTab === 'pinned' && activeConversation?.id) {
            api.getPinnedMessages(activeConversation.id)
                .then(data => setPinnedMessages(data || []))
                .catch(() => setPinnedMessages([]));
        }
    }, [activeTab, activeConversation?.id]);

    const handleReport = async () => {
        if (!reportMessageId || !reportReason) return;
        try {
            await api.reportMessage(reportMessageId, reportReason);
            setShowReportModal(false);
            setReportReason('');
            setReportMessageId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMute = async (userId: string) => {
        if (!activeConversation) return;
        try {
            await api.muteUser(activeConversation.id, userId, 60);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBan = async (userId: string) => {
        if (!activeConversation) return;
        try {
            await api.banUser(activeConversation.id, userId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!activeConversation) return;
        try {
            await api.removeUser(activeConversation.id, userId);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <aside
                className="glass-panel-strong flex flex-col h-full animate-slide-right"
                style={{ width: '280px', minWidth: '280px', borderLeft: '1px solid var(--border-color)' }}
            >
                {/* Header */}
                <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <h3 className="font-semibold text-sm mb-3">Details</h3>

                    {/* Call status */}
                    {isInCall && activeCall && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
                            style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            <Phone size={14} style={{ color: 'var(--success)' }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Call Active</span>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1">
                        {[
                            { key: 'members' as const, label: 'Members', icon: Users, count: participants.length },
                            { key: 'pinned' as const, label: 'Pinned', icon: Pin },
                            { key: 'files' as const, label: 'Files', icon: Paperclip },
                        ].map(({ key, label, icon: Icon, count }) => (
                            <button
                                key={key}
                                className="btn btn-ghost flex-1 text-xs"
                                style={activeTab === key ? { background: 'var(--bg-elevated)', color: 'var(--accent)' } : {}}
                                onClick={() => setActiveTab(key)}
                            >
                                <Icon size={13} />
                                {label}
                                {count !== undefined && <span className="opacity-50 ml-0.5">{count}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3">
                    {activeTab === 'members' && (
                        <div className="space-y-1">
                            {participants.map((member: Account) => (
                                <div key={member.id}
                                    className="flex items-center gap-3 p-2.5 rounded-lg transition-colors group relative"
                                    style={{ cursor: member.id !== user?.id ? 'pointer' : 'default' }}
                                >
                                    <div className="avatar avatar-sm relative">
                                        {member.avatar_url ? <img src={member.avatar_url} alt="" /> : member.display_name?.charAt(0).toUpperCase()}
                                        {member.status === 'online' && <div className="online-dot" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-medium truncate">{member.display_name}</span>
                                            {member.id === user?.id && <span className="text-xs opacity-40">(you)</span>}
                                        </div>
                                        <span className="text-xs capitalize" style={{
                                            color: member.role === 'owner' ? 'var(--accent)' : member.role === 'moderator' ? 'var(--warning)' : 'var(--text-muted)',
                                        }}>
                                            {member.role}
                                        </span>
                                    </div>

                                    {/* Mod actions */}
                                    {isModerator && member.id !== user?.id && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowModActions(showModActions === member.id ? null : member.id)}
                                                className="btn btn-icon btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ padding: '0.25rem' }}
                                            >
                                                <Shield size={14} />
                                            </button>

                                            {showModActions === member.id && (
                                                <div className="absolute right-0 top-8 z-30 glass-panel-strong rounded-lg p-1 w-40 animate-fade-in">
                                                    <button onClick={() => handleMute(member.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-[var(--bg-elevated)] transition-colors">
                                                        <VolumeX size={13} /> Mute (1h)
                                                    </button>
                                                    <button onClick={() => handleRemove(member.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-[var(--bg-elevated)] transition-colors">
                                                        <UserMinus size={13} /> Remove
                                                    </button>
                                                    <button onClick={() => handleBan(member.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-[var(--bg-elevated)] transition-colors"
                                                        style={{ color: 'var(--danger)' }}>
                                                        <Ban size={13} /> Ban
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'pinned' && (
                        <div className="space-y-2">
                            {pinnedMessages.length === 0 ? (
                                <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                                    <Pin size={24} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-xs">No pinned messages</p>
                                </div>
                            ) : (
                                pinnedMessages.map(pin => (
                                    <div key={pin.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium">{pin.message?.author?.display_name}</span>
                                            <Pin size={10} style={{ color: 'var(--accent)' }} />
                                        </div>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            {pin.message?.content}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                            <Paperclip size={24} className="mx-auto mb-2 opacity-40" />
                            <p className="text-xs">Shared files will appear here</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Report Modal */}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                            Report Message
                        </h2>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Describe the issue..."
                            className="input mb-4"
                            rows={4}
                            style={{ resize: 'none' }}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowReportModal(false)} className="btn btn-ghost flex-1">Cancel</button>
                            <button onClick={handleReport} className="btn btn-danger flex-1" disabled={!reportReason}>Submit Report</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
