'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useCallStore } from '@/stores/callStore';
import { useNicknameStore } from '@/stores/nicknameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { api } from '@/lib/api';
import { Account } from '@/types';
import {
    Users, Pin, Paperclip, Shield, UserMinus, Ban,
    VolumeX, PhoneCall, Edit3
} from 'lucide-react';

export default function RightPanel() {
    const { user } = useAuthStore();
    const { activeConversation } = useConversationStore();
    const { activeCall, isInCall } = useCallStore();
    const { getDisplayName, nicknames, setNickname, removeNickname } = useNicknameStore();
    const isMobile = useIsMobile();

    const [activeTab, setActiveTab] = useState<'members' | 'pinned' | 'files'>('members');
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
    const [showModMenu, setShowModMenu] = useState<string | null>(null);
    const [editingNicknameFor, setEditingNicknameFor] = useState<string | null>(null);
    const [nicknameInput, setNicknameInput] = useState('');

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

    const handleMute = async (userId: string) => { if (activeConversation) try { await api.muteUser(activeConversation.id, userId, 60); } catch { } };
    const handleBan = async (userId: string) => { if (activeConversation) try { await api.banUser(activeConversation.id, userId); } catch { } };
    const handleRemove = async (userId: string) => { if (activeConversation) try { await api.removeUser(activeConversation.id, userId); } catch { } };

    const tabBtn = (key: string, icon: React.ReactNode, count?: number) => (
        <button
            onClick={() => setActiveTab(key as any)}
            style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: activeTab === key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === key ? '#fff' : '#525252',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
        >
            {icon}
            {count !== undefined && <span>{count}</span>}
        </button>
    );

    if (isMobile) return null;

    return (
        <aside style={{
            width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%',
            background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'Inter', system-ui, sans-serif", color: '#fff', position: 'relative', zIndex: 10,
        }}>
            {/* Header */}
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#525252', marginBottom: 12 }}>Details</p>

                {isInCall && activeCall && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, marginBottom: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        <div style={{ background: '#fff', color: '#000', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PhoneCall size={12} className="animate-pulse" />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Call Active</span>
                    </div>
                )}

                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {tabBtn('members', <Users size={13} />, participants.length)}
                    {tabBtn('pinned', <Pin size={13} />)}
                    {tabBtn('files', <Paperclip size={13} />)}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {activeTab === 'members' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {participants.map((member: Account) => (
                            <div key={member.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                                    borderRadius: 12, transition: 'background 0.2s', position: 'relative',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; setShowModMenu(null); }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 600,
                                }}>
                                    {member.display_name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {editingNicknameFor === member.id ? (
                                        <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={nicknameInput}
                                                onChange={e => setNicknameInput(e.target.value)}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        if (nicknameInput.trim()) {
                                                            await setNickname(member.id, nicknameInput.trim());
                                                        } else {
                                                            await removeNickname(member.id);
                                                        }
                                                        setEditingNicknameFor(null);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingNicknameFor(null);
                                                    }
                                                }}
                                                onBlur={() => setEditingNicknameFor(null)}
                                                placeholder={member.display_name}
                                                style={{
                                                    width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                                                    borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 13, outline: 'none'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: member.id !== user?.id ? 'pointer' : 'default' }}
                                            onClick={() => {
                                                if (member.id !== user?.id) {
                                                    setEditingNicknameFor(member.id);
                                                    setNicknameInput(nicknames[member.id] || '');
                                                }
                                            }}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Click to set nickname">
                                                {getDisplayName(member.id, member.display_name)}
                                            </span>
                                            {nicknames[member.id] && (
                                                <span style={{ fontSize: 10, color: '#a3a3a3', textDecoration: 'line-through' }}>{member.display_name}</span>
                                            )}
                                            {member.id === user?.id && <span style={{ fontSize: 9, color: '#525252', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>You</span>}
                                        </div>
                                    )}
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
                                        color: member.role === 'owner' ? '#fff' : member.role === 'moderator' ? '#d4d4d4' : '#525252',
                                    }}>
                                        {member.role}
                                    </span>
                                </div>

                                {isModerator && member.id !== user?.id && (
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setShowModMenu(showModMenu === member.id ? null : member.id)}
                                            style={{
                                                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'transparent', border: 'none', color: '#404040', cursor: 'pointer',
                                            }}>
                                            <Shield size={14} />
                                        </button>
                                        {showModMenu === member.id && (
                                            <div style={{
                                                position: 'absolute', right: 0, top: 32, width: 160, padding: 4,
                                                background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 12, backdropFilter: 'blur(20px)', zIndex: 20,
                                            }}>
                                                {[
                                                    { label: 'Mute (1h)', icon: <VolumeX size={13} />, onClick: () => handleMute(member.id), danger: false },
                                                    { label: 'Remove', icon: <UserMinus size={13} />, onClick: () => handleRemove(member.id), danger: false },
                                                    { label: 'Ban User', icon: <Ban size={13} />, onClick: () => handleBan(member.id), danger: true },
                                                ].map((action, i) => (
                                                    <button key={i} onClick={() => { action.onClick(); setShowModMenu(null); }}
                                                        style={{
                                                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                                            padding: '8px 10px', borderRadius: 8, border: 'none',
                                                            background: 'transparent', cursor: 'pointer', fontSize: 12,
                                                            color: action.danger ? '#ef4444' : '#d4d4d4',
                                                            fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = action.danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.08)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        {action.icon} {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pinned' && (
                    pinnedMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 14, margin: '0 auto 10px',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Pin size={16} style={{ color: '#404040' }} />
                            </div>
                            <p style={{ fontSize: 10, color: '#525252', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>No pinned messages</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {pinnedMessages.map(pin => (
                                <div key={pin.id} style={{
                                    padding: '12px 14px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'rgba(255,255,255,0.2)' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingLeft: 6 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600 }}>{getDisplayName(pin.message?.author_id, pin.message?.author?.display_name)}</span>
                                        <Pin size={12} style={{ color: '#525252' }} />
                                    </div>
                                    <p style={{ fontSize: 12, color: '#737373', paddingLeft: 6, lineHeight: 1.5 }}>{pin.message?.content}</p>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {activeTab === 'files' && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 14, margin: '0 auto 10px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Paperclip size={16} style={{ color: '#404040' }} />
                        </div>
                        <p style={{ fontSize: 10, color: '#525252', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>No shared files</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
