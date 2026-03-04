"use client";

import { useEffect, useRef } from "react";
<<<<<<< HEAD
import { useWebRTC } from "@/hooks/useWebRTC";
=======
import { useWebRTC } from "../../hooks/useWebRTC";
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
import { MicOff, VideoOff, PhoneOff } from "lucide-react";

interface VideoRoomProps {
    topicId: string;
    currentUserId: string;
    onClose: () => void;
}

export default function VideoRoom({ topicId, currentUserId, onClose }: VideoRoomProps) {
    const { localStream, remoteStreams, joinCall, leaveCall } = useWebRTC(topicId, currentUserId);
    const localVideoRef = useRef<HTMLVideoElement>(null);

<<<<<<< HEAD
    useEffect(() => {
        joinCall().catch(console.error);
        return () => { leaveCall(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

=======
    // Initialize the call as soon as the component mounts
    useEffect(() => {
        joinCall().catch(console.error);

        return () => {
            leaveCall();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Attach local stream to video element
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

<<<<<<< HEAD
=======
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

>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
    return (
        <div className="flex flex-col h-64 border-b border-border bg-surface-hover relative overflow-hidden">
            <div className="absolute top-2 left-4 z-10">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
<<<<<<< HEAD
                    <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
=======
                    <span className="w-2 h-2 rounded-full bg-white"></span>
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
                    Live Call
                </span>
            </div>

<<<<<<< HEAD
            <div className="flex-1 flex gap-2 p-2 overflow-x-auto items-center justify-center">
                <div className="relative h-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border-2 border-brand-500/50">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">You</div>
                </div>

=======
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
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                    <RemoteVideo key={peerId} stream={stream} peerId={peerId} />
                ))}

                {remoteStreams.size === 0 && (
                    <div className="flex flex-col items-center justify-center h-full aspect-video bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
<<<<<<< HEAD
                        <span className="text-text-tertiary text-sm">Waiting for others...</span>
=======
                        <span className="text-text-tertiary text-sm">Waiting for others to join...</span>
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
                    </div>
                )}
            </div>

<<<<<<< HEAD
            <div className="h-14 bg-black/60 backdrop-blur flex items-center justify-center gap-4">
                <button onClick={() => localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; })} className="p-3 bg-surface hover:bg-surface-hover rounded-full text-white" title="Toggle Mic">
                    <MicOff size={18} />
                </button>
                <button onClick={() => localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; })} className="p-3 bg-surface hover:bg-surface-hover rounded-full text-white" title="Toggle Camera">
                    <VideoOff size={18} />
                </button>
                <button onClick={() => { leaveCall(); onClose(); }} className="p-3 bg-red-500 hover:bg-red-600 rounded-full text-white" title="Leave">
=======
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
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
                    <PhoneOff size={18} />
                </button>
            </div>
        </div>
    );
}

<<<<<<< HEAD
function RemoteVideo({ stream, peerId }: { stream: MediaStream; peerId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
    }, [stream]);
    return (
        <div className="relative h-full aspect-video bg-black rounded-xl overflow-hidden shadow-md">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white truncate max-w-[100px]">{peerId.substring(0, 6)}...</div>
=======
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
>>>>>>> 4adca768ab3bf2a9d2d726ed29cf554bda79432f
        </div>
    );
}
