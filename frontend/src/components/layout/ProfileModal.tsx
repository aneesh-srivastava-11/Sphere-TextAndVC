'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { X, Upload, Loader2, Save } from 'lucide-react';

export default function ProfileModal({ onClose }: { onClose: () => void }) {
    const { user, updateProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile({ display_name: displayName, avatar_url: avatarUrl });
            onClose();
        } catch (err) {
            console.error('Failed to update profile', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: '100%', maxWidth: 400, background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Edit Profile</h2>
                        <p style={{ fontSize: 12, color: '#737373', marginTop: 4 }}>Customize your appearance.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer', padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28, fontWeight: 600, overflow: 'hidden', position: 'relative'
                        }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                displayName.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: 8 }}>Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            style={{
                                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
                                transition: 'all 0.3s', fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: 8 }}>Avatar URL</label>
                        <input
                            type="text"
                            value={avatarUrl}
                            onChange={e => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            style={{
                                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
                                transition: 'all 0.3s', fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ height: 16 }} />

                    <button
                        onClick={handleSave}
                        disabled={loading || !displayName.trim()}
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)', color: '#000',
                            fontWeight: 700, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%',
                            fontFamily: 'inherit', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: (loading || !displayName.trim()) ? 0.5 : 1
                        }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
