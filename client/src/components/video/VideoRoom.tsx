"use client";

import { useEffect, useRef } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import { MicOff, VideoOff, PhoneOff } from "lucide-react";

interface VideoRoomProps {
    topicId: string;
    currentUserId: string;
    onClose: () => void;
}

export default function VideoRoom({ topicId, currentUserId, onClose }: VideoRoomProps) {
    const { localStream, remoteStreams, joinCall, leaveCall } = useWebRTC(topicId, currentUserId);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Initialize the call as soon as the component mounts
    useEffect(() => {
        joinCall().catch(console.error);

        return () => {
            leaveCall();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const handleDisconnect = () => {
        leaveCall();
        onClose();
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
    };

    return (
        <div className="flex flex-col h-64 border-b border-border bg-surface-hover relative overflow-hidden">
            <div className="absolute top-2 left-4 z-10">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    Live Call
                </span>
            </div>

            <div className="flex-1 flex gap-2 p-2 overflow-x-auto custom-scrollbar items-center justify-center">
                {/* Local Video */}
                <div className="relative h-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border-2 border-brand-500/50">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">
                        You
                    </div>
                </div>

                {/* Remote Videos */}
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                    <RemoteVideo key={peerId} stream={stream} peerId={peerId} />
                ))}

                {remoteStreams.size === 0 && (
                    <div className="flex flex-col items-center justify-center h-full aspect-video bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-text-tertiary text-sm">Waiting for others to join...</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="h-14 bg-black/60 backdrop-blur flex items-center justify-center gap-4">
                <button
                    onClick={toggleAudio}
                    className="p-3 bg-surface hover:bg-surface-hover rounded-full text-white transition-colors"
                    title="Toggle Microphone"
                >
                    <MicOff size={18} />
                </button>
                <button
                    onClick={toggleVideo}
                    className="p-3 bg-surface hover:bg-surface-hover rounded-full text-white transition-colors"
                    title="Toggle Camera"
                >
                    <VideoOff size={18} />
                </button>
                <button
                    onClick={handleDisconnect}
                    className="p-3 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-transform hover:scale-105"
                    title="Leave Call"
                >
                    <PhoneOff size={18} />
                </button>
            </div>
        </div>
    );
}

// Sub-component for remote videos to handle their own refs
function RemoteVideo({ stream, peerId }: { stream: MediaStream, peerId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative h-full aspect-video bg-black rounded-xl overflow-hidden shadow-md">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-sm truncate max-w-[100px]">
                {peerId.substring(0, 6)}...
            </div>
        </div>
    );
}
