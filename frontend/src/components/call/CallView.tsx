'use client';

import { useEffect, useRef } from 'react';
import { useCallStore } from '@/stores/callStore';
import { useAuthStore } from '@/stores/authStore';
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, Users,
} from 'lucide-react';

export default function CallView() {
    const { user } = useAuthStore();
    const {
        localStream, peers, isCameraOn, isMicOn, isScreenSharing, isInCall,
        leaveCall, toggleCamera, toggleMic, toggleScreenShare,
    } = useCallStore();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    if (!isInCall) return null;

    const peerArray = Array.from(peers.values());

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
                    <span className="font-semibold">Active Call</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Users size={14} className="inline mr-1" />
                        {peerArray.length + 1} participant{peerArray.length !== 0 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Video grid */}
            <div className="flex-1 p-6 overflow-hidden">
                <div className="h-full grid gap-4"
                    style={{
                        gridTemplateColumns: peerArray.length === 0 ? '1fr' : peerArray.length <= 1 ? 'repeat(2, 1fr)' : peerArray.length <= 3 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gridAutoRows: '1fr',
                    }}>
                    {/* Local video */}
                    <div className="relative rounded-2xl overflow-hidden flex items-center justify-center"
                        style={{ background: 'var(--bg-tertiary)', border: '2px solid var(--accent)', minHeight: '200px' }}>
                        {isCameraOn && localStream ? (
                            <video ref={localVideoRef} autoPlay muted playsInline
                                className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                        ) : (
                            <div className="avatar avatar-lg">
                                {user?.display_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                            You {!isMicOn && '🔇'}
                        </div>
                    </div>

                    {/* Remote videos */}
                    {peerArray.map(peer => (
                        <PeerVideo key={peer.userId} peer={peer} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 py-5"
                style={{ borderTop: '1px solid var(--border-color)' }}>
                <button onClick={toggleCamera}
                    className={`btn btn-icon ${isCameraOn ? 'btn-secondary' : 'btn-danger'}`}
                    style={{ width: '52px', height: '52px', borderRadius: '50%' }}
                    title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
                    {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                <button onClick={toggleMic}
                    className={`btn btn-icon ${isMicOn ? 'btn-secondary' : 'btn-danger'}`}
                    style={{ width: '52px', height: '52px', borderRadius: '50%' }}
                    title={isMicOn ? 'Mute' : 'Unmute'}>
                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button onClick={toggleScreenShare}
                    className={`btn btn-icon ${isScreenSharing ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '52px', height: '52px', borderRadius: '50%' }}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                    {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                </button>

                <button onClick={leaveCall}
                    className="btn btn-icon btn-danger"
                    style={{ width: '52px', height: '52px', borderRadius: '50%' }}
                    title="Leave call">
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
}

function PeerVideo({ peer }: { peer: { userId: string; socketId: string; stream?: MediaStream } }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div className="relative rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', minHeight: '200px' }}>
            {peer.stream ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
                <div className="avatar avatar-lg">
                    {peer.userId.charAt(0).toUpperCase()}
                </div>
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                Participant
            </div>
        </div>
    );
}
