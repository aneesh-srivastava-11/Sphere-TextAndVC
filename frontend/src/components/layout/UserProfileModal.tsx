import { useState } from 'react';
import { useNicknameStore } from '@/stores/nicknameStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConversationStore } from '@/stores/conversationStore';
import { api } from '@/lib/api';
import { AlertCircle, Ban, Loader2, X, Mail, User, Shield } from 'lucide-react';
import { Account } from '@/types';

interface UserProfileModalProps {
    user: Account;
    onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
    const { getDisplayName } = useNicknameStore();
    const { activeConversation } = useConversationStore();
    const isMobile = useIsMobile();
    const nickname = getDisplayName(user.id, user.display_name);
    const hasNickname = nickname !== user.display_name;

    const [reporting, setReporting] = useState(false);
    const [blocking, setBlocking] = useState(false);

    const handleReport = async () => {
        const reason = prompt('Please describe the reason for reporting this user:');
        if (!reason || !activeConversation) return;

        setReporting(true);
        try {
            await api.reportUser(user.id, activeConversation.id, reason);
            alert('User reported successfully. Our team will review the context.');
        } catch (err) {
            alert('Failed to send report.');
        } finally {
            setReporting(false);
        }
    };

    const handleBlock = async () => {
        if (!confirm(`Are you sure you want to block ${nickname}? They won't be able to message you.`)) return;

        setBlocking(true);
        try {
            await api.blockUser(user.id);
            alert('User blocked.');
            onClose();
        } catch (err) {
            alert('Failed to block user.');
        } finally {
            setBlocking(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                padding: isMobile ? 16 : 24
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: '100%',
                maxWidth: 400,
                background: 'rgba(20,20,20,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 0,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                fontFamily: "'Inter', system-ui, sans-serif",
                color: '#fff',
                overflow: 'hidden',
                animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <style>{`
                    @keyframes modalSlideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>

                {/* Cover/Avatar Section */}
                <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                padding: 8,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 24px 24px', marginTop: -50, textAlign: 'center' }}>
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: 32,
                        background: 'rgba(30,30,30,1)',
                        border: '4px solid rgba(20,20,20,1)',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        fontWeight: 700,
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
                    }}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            user.display_name.charAt(0).toUpperCase()
                        )}
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {nickname}
                    </h2>
                    {hasNickname && (
                        <p style={{ fontSize: 13, color: '#737373', marginBottom: 16 }}>
                            @{user.display_name}
                        </p>
                    )}
                    {!hasNickname && <div style={{ height: 16 }} />}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 16,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: '#525252' }}><Mail size={16} /></div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#525252', marginBottom: 2 }}>Email Address</label>
                                    <p style={{ fontSize: 13, color: '#d4d4d4' }}>{user.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: '#525252' }}><User size={16} /></div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#525252', marginBottom: 2 }}>Full Name</label>
                                    <p style={{ fontSize: 13, color: '#d4d4d4' }}>{user.display_name}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: '#525252' }}><Shield size={16} /></div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#525252', marginBottom: 2 }}>Role</label>
                                    <p style={{ fontSize: 13, color: '#d4d4d4' }}>{user.role || 'Member'}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    <button
                        onClick={handleReport}
                        disabled={reporting || !activeConversation}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 12,
                            color: '#ef4444',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s'
                        }}
                    >
                        {reporting ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                        Report
                    </button>
                    <button
                        onClick={handleBlock}
                        disabled={blocking}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 12,
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s'
                        }}
                    >
                        {blocking ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                        Block
                    </button>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 12,
                        color: '#737373',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    Close Profile
                </button>
            </div>
        </div>
    );
}
