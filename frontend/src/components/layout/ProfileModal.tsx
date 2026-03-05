'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { X, Upload, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';

export default function ProfileModal({ onClose }: { onClose: () => void }) {
    const { user, updateProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await api.uploadFile(file, 'avatars');
            setAvatarUrl(url);
        } catch (err) {
            console.error('Failed to upload avatar', err);
            alert('Failed to upload image. Ensure the file is a valid image and under 5MB.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
            <style>{`.avatar-overlay:hover { opacity: 1 !important; }`}</style>
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 28, fontWeight: 600, overflow: 'hidden', position: 'relative', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            {uploading ? (
                                <Loader2 size={24} className="animate-spin" color="#737373" />
                            ) : avatarUrl ? (
                                <>
                                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                        className="avatar-overlay">
                                        <Upload size={20} color="#fff" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {displayName.charAt(0).toUpperCase()}
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                        className="avatar-overlay">
                                        <Upload size={20} color="#fff" />
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={handleFileSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d4', fontSize: 11, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <ImageIcon size={14} /> Upload Picture
                        </button>
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
                        disabled={loading || uploading || !displayName.trim()}
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)', color: '#000',
                            fontWeight: 700, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%',
                            fontFamily: 'inherit', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: (loading || uploading || !displayName.trim()) ? 0.5 : 1
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
