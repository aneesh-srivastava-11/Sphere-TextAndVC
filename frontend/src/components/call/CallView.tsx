'use client';

import { useEffect, useRef } from 'react';
import { useCallStore } from '@/stores/callStore';
import { useAuthStore } from '@/stores/authStore';
import { PeerConnection } from '@/types';
import {
    PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, Users,
} from 'lucide-react';

export default function CallView() {
    const { user } = useAuthStore();
    const {
        localStream, peers, isCameraOn, isMicOn, isScreenSharing, isInCall,
        leaveCall, toggleCamera, toggleMic, toggleScreenShare,
    } = useCallStore();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream && isCameraOn) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isCameraOn]);

    if (!isInCall) return null;

    const peerArray = Array.from(peers.values());

    const controlBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, danger?: boolean) => (
        <button
            onClick={onClick}
            style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: danger ? '#dc2626' : !active ? '#ef4444' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${danger || !active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
            }}
        >
            {icon}
        </button>
    );

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                background: 'radial-gradient(circle at top center, #171717 0%, #000000 100%)',
                fontFamily: "'Inter', system-ui, sans-serif",
                color: '#fff',
                height: '100dvh',
                overflow: 'hidden',
                touchAction: 'none'
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.05em' }}>ACTIVE CALL</span>
                    <span style={{ color: '#737373', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={14} />
                        {peerArray.length + 1} participant{peerArray.length !== 0 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Video grid */}
            <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
                <div
                    style={{
                        height: '100%',
                        display: 'grid',
                        gap: 16,
                        gridTemplateColumns: peerArray.length === 0 ? '1fr' : peerArray.length <= 1 ? 'repeat(2, 1fr)' : peerArray.length <= 3 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gridAutoRows: '1fr',
                    }}
                >
                    {/* Local video */}
                    <div
                        style={{
                            position: 'relative',
                            borderRadius: 20,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            minHeight: 200,
                        }}
                    >
                        {isCameraOn && localStream ? (
                            <video ref={localVideoRef} autoPlay muted playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        ) : (
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 16,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24,
                                    fontWeight: 700,
                                }}
                            >
                                {user?.display_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 12,
                                left: 12,
                                padding: '4px 12px',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(8px)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            You {!isMicOn && <MicOff size={12} style={{ color: '#ef4444' }} />}
                        </div>
                    </div>

                    {/* Remote videos */}
                    {peerArray.map(peer => (
                        <PeerVideo key={peer.userId} peer={peer} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    padding: '20px 0',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                {controlBtn(isCameraOn, toggleCamera, isCameraOn ? <Video size={20} /> : <VideoOff size={20} />)}
                {controlBtn(isMicOn, toggleMic, isMicOn ? <Mic size={20} /> : <MicOff size={20} />)}
                {typeof navigator !== 'undefined' && navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia &&
                    controlBtn(isScreenSharing, toggleScreenShare, isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />)
                }
                {controlBtn(false, leaveCall, <PhoneOff size={20} />, true)}
            </div>
        </div>
    );
}

function PeerVideo({ peer }: { peer: PeerConnection }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 200,
            }}
        >
            {peer.stream ? (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                    }}
                >
                    {peer.userId.charAt(0).toUpperCase()}
                </div>
            )}
            <div
                style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}
            >
                {peer.displayName || 'Participant'} {peer.isMicOn === false && <MicOff size={12} style={{ color: '#ef4444' }} />}
            </div>
        </div>
    );
}
