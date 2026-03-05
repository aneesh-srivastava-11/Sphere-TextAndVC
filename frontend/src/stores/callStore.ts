'use client';

import { create } from 'zustand';
import { CallSession, PeerConnection } from '@/types';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from './authStore';
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

    handleUserJoined: (data: { userId: string; socketId: string; displayName: string; callId: string }) => Promise<void>;
    handleParticipants: (data: { callId: string; participants: { userId: string; socketId: string; displayName: string }[] }) => Promise<void>;
    handleUserLeft: (data: { userId: string; callId: string }) => void;
    handleOffer: (data: { offer: RTCSessionDescriptionInit; fromUserId: string; fromSocketId: string; fromDisplayName: string }) => Promise<void>;
    handleAnswer: (data: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => Promise<void>;
    handleIceCandidate: (data: { candidate: RTCIceCandidateInit; fromSocketId: string }) => Promise<void>;
    handleStatusUpdate: (data: { userId: string; isMicOn: boolean; isCameraOn: boolean }) => void;
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
                socket.emit('call_join', {
                    callId,
                    conversationId: get().activeCall?.conversation_id,
                    isMicOn: true,
                    isCameraOn: true
                });
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
        const { localStream, isCameraOn, activeCall } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach(t => { t.enabled = !isCameraOn; });
            set({ isCameraOn: !isCameraOn });

            const socket = getSocket();
            if (socket && activeCall) {
                socket.emit('call_status_update', {
                    callId: activeCall.id,
                    isMicOn: get().isMicOn,
                    isCameraOn: !isCameraOn
                });
            }
        }
    },

    toggleMic: () => {
        const { localStream, isMicOn, activeCall } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
            set({ isMicOn: !isMicOn });

            const socket = getSocket();
            if (socket && activeCall) {
                socket.emit('call_status_update', {
                    callId: activeCall.id,
                    isMicOn: !isMicOn,
                    isCameraOn: get().isCameraOn
                });
            }
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

        // Add peer to state immediately so ontrack can find it
        set((state) => {
            const peers = new Map(state.peers);
            peers.set(data.userId, {
                userId: data.userId,
                socketId: data.socketId,
                displayName: data.displayName,
                connection: pc
            });
            return { peers };
        });

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
            fromDisplayName: useAuthStore.getState().user?.display_name || 'User'
        });
    },

    handleParticipants: async (data) => {
        const { handleUserJoined } = get();
        for (const p of data.participants) {
            await handleUserJoined({ ...p, callId: data.callId });
        }
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

        // Add peer to state immediately so ontrack can find it
        set((state) => {
            const peers = new Map(state.peers);
            peers.set(data.fromUserId, {
                userId: data.fromUserId,
                socketId: data.fromSocketId,
                displayName: data.fromDisplayName,
                connection: pc,
            });
            return { peers };
        });

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

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Process queued candidates
        const queuedCandidates = (pc as any).candidateQueue || [];
        for (const cand of queuedCandidates) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
                console.error('Failed to add queued ICE candidate in handleOffer:', err);
            }
        }
        (pc as any).candidateQueue = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call_answer', {
            targetSocketId: data.fromSocketId,
            answer,
            callId: '',
        });
    },

    handleAnswer: async (data) => {
        const peers = get().peers;
        for (const [userId, peer] of peers.entries()) {
            if (peer.socketId === data.fromSocketId) {
                try {
                    if (peer.connection.signalingState !== 'stable') {
                        await peer.connection.setRemoteDescription(new RTCSessionDescription(data.answer));

                        // Process queued candidates
                        const queuedCandidates = (peer as any).candidateQueue || [];
                        for (const cand of queuedCandidates) {
                            await peer.connection.addIceCandidate(new RTCIceCandidate(cand));
                        }
                        (peer as any).candidateQueue = [];
                    }
                } catch (err) {
                    console.error('Failed to set remote answer:', err);
                }
                break;
            }
        }
    },

    handleIceCandidate: async (data) => {
        const peers = get().peers;
        for (const [userId, peer] of peers.entries()) {
            if (peer.socketId === data.fromSocketId) {
                try {
                    if (peer.connection.remoteDescription) {
                        await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } else {
                        // Queue candidate if remote description isn't set yet
                        if (!(peer as any).candidateQueue) (peer as any).candidateQueue = [];
                        (peer as any).candidateQueue.push(data.candidate);
                    }
                } catch (err) {
                    console.error('Failed to add ICE candidate:', err);
                }
                break;
            }
        }
    },

    handleStatusUpdate: (data: { userId: string; isMicOn: boolean; isCameraOn: boolean }) => {
        set((state) => {
            const peers = new Map(state.peers);
            const peer = peers.get(data.userId);
            if (peer) {
                peers.set(data.userId, {
                    ...peer,
                    isMicOn: data.isMicOn,
                    isCameraOn: data.isCameraOn
                });
            }
            return { peers };
        });
    },
}));
