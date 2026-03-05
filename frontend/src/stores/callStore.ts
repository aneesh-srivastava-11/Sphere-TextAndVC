'use client';

import { create } from 'zustand';
import { CallSession, PeerConnection } from '@/types';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { createPeerConnection, getUserMedia, getDisplayMedia, addStreamTracks } from '@/lib/webrtc';

interface CallState {
    activeCall: CallSession | null;
    localStream: MediaStream | null;
    screenStream: MediaStream | null;
    peers: Map<string, PeerConnection>;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;
    isInCall: boolean;

    startCall: (conversationId: string) => Promise<void>;
    joinCall: (callId: string) => Promise<void>;
    leaveCall: () => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    toggleScreenShare: () => Promise<void>;

    handleUserJoined: (data: { userId: string; socketId: string; callId: string }) => Promise<void>;
    handleUserLeft: (data: { userId: string; callId: string }) => void;
    handleOffer: (data: { offer: RTCSessionDescriptionInit; fromUserId: string; fromSocketId: string }) => Promise<void>;
    handleAnswer: (data: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => void;
    handleIceCandidate: (data: { candidate: RTCIceCandidateInit; fromSocketId: string }) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
    activeCall: null,
    localStream: null,
    screenStream: null,
    peers: new Map(),
    isCameraOn: true,
    isMicOn: true,
    isScreenSharing: false,
    isInCall: false,

    startCall: async (conversationId) => {
        try {
            const call = await api.startCall(conversationId);
            set({ activeCall: call });
            await get().joinCall(call.id);
        } catch (err) {
            console.error('Failed to start call:', err);
        }
    },

    joinCall: async (callId) => {
        try {
            const stream = await getUserMedia(true, true);
            set({ localStream: stream, isInCall: true, isCameraOn: true, isMicOn: true });

            const socket = getSocket();
            if (socket) {
                socket.emit('call_join', { callId, conversationId: get().activeCall?.conversation_id });
            }
        } catch (err) {
            console.error('Failed to join call:', err);
        }
    },

    leaveCall: () => {
        const { localStream, screenStream, peers, activeCall } = get();

        localStream?.getTracks().forEach(t => t.stop());
        screenStream?.getTracks().forEach(t => t.stop());

        peers.forEach(peer => {
            peer.connection.close();
        });

        const socket = getSocket();
        if (socket && activeCall) {
            socket.emit('call_leave', { callId: activeCall.id });
        }

        set({
            localStream: null,
            screenStream: null,
            peers: new Map(),
            isInCall: false,
            isCameraOn: true,
            isMicOn: true,
            isScreenSharing: false,
            activeCall: null,
        });
    },

    toggleCamera: () => {
        const { localStream, isCameraOn } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach(t => { t.enabled = !isCameraOn; });
            set({ isCameraOn: !isCameraOn });
        }
    },

    toggleMic: () => {
        const { localStream, isMicOn } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
            set({ isMicOn: !isMicOn });
        }
    },

    toggleScreenShare: async () => {
        const { isScreenSharing, screenStream } = get();

        if (isScreenSharing && screenStream) {
            screenStream.getTracks().forEach(t => t.stop());
            set({ screenStream: null, isScreenSharing: false });
        } else {
            try {
                const stream = await getDisplayMedia();
                set({ screenStream: stream, isScreenSharing: true });

                stream.getVideoTracks()[0].onended = () => {
                    set({ screenStream: null, isScreenSharing: false });
                };
            } catch (err) {
                console.error('Failed to share screen:', err);
            }
        }
    },

    handleUserJoined: async (data) => {
        const { localStream } = get();
        const socket = getSocket();
        if (!localStream || !socket) return;

        const pc = createPeerConnection();
        addStreamTracks(pc, localStream);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', {
                    targetSocketId: data.socketId,
                    candidate: event.candidate.toJSON(),
                    callId: data.callId,
                });
            }
        };

        pc.ontrack = (event) => {
            set((state) => {
                const peers = new Map(state.peers);
                const existing = peers.get(data.userId);
                if (existing) {
                    peers.set(data.userId, { ...existing, stream: event.streams[0] });
                }
                return { peers };
            });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call_offer', {
            targetSocketId: data.socketId,
            offer,
            callId: data.callId,
        });

        set((state) => {
            const peers = new Map(state.peers);
            peers.set(data.userId, { userId: data.userId, socketId: data.socketId, connection: pc });
            return { peers };
        });
    },

    handleUserLeft: (data) => {
        set((state) => {
            const peers = new Map(state.peers);
            const peer = peers.get(data.userId);
            if (peer) {
                peer.connection.close();
                peers.delete(data.userId);
            }
            return { peers };
        });
    },

    handleOffer: async (data) => {
        const { localStream } = get();
        const socket = getSocket();
        if (!localStream || !socket) return;

        const pc = createPeerConnection();
        addStreamTracks(pc, localStream);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', {
                    targetSocketId: data.fromSocketId,
                    candidate: event.candidate.toJSON(),
                    callId: '',
                });
            }
        };

        pc.ontrack = (event) => {
            set((state) => {
                const peers = new Map(state.peers);
                const existing = peers.get(data.fromUserId);
                if (existing) {
                    peers.set(data.fromUserId, { ...existing, stream: event.streams[0] });
                }
                return { peers };
            });
        };

        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call_answer', {
            targetSocketId: data.fromSocketId,
            answer,
            callId: '',
        });

        set((state) => {
            const peers = new Map(state.peers);
            peers.set(data.fromUserId, {
                userId: data.fromUserId,
                socketId: data.fromSocketId,
                connection: pc,
            });
            return { peers };
        });
    },

    handleAnswer: (data) => {
        const peers = get().peers;
        // Find peer by socketId
        peers.forEach(peer => {
            if (peer.socketId === data.fromSocketId) {
                peer.connection.setRemoteDescription(data.answer);
            }
        });
    },

    handleIceCandidate: (data) => {
        const peers = get().peers;
        peers.forEach(peer => {
            if (peer.socketId === data.fromSocketId) {
                peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });
    },
}));
