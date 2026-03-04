import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, getDoc, deleteDoc, query, getDocs } from 'firebase/firestore';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export function useWebRTC(topicId: string, currentUserId: string) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [isInCall, setIsInCall] = useState(false);

    // Store peer connections manually so they don't trigger constant re-renders
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

    const getLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error("Error accessing media devices", error);
            throw error;
        }
    };

    const cleanup = useCallback(async () => {
        localStream?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        setRemoteStreams(new Map());
        setIsInCall(false);

        // Delete our call node from Firestore
        if (topicId && currentUserId) {
            await deleteDoc(doc(db, `calls_${topicId}`, currentUserId));
        }
    }, [localStream, topicId, currentUserId]);

    const joinCall = async () => {
        setIsInCall(true);
        const stream = await getLocalStream();

        // Setup Firestore listener to detect others in the call room
        const callsCollection = collection(db, `calls_${topicId}`);
        const currentCallDoc = doc(callsCollection, currentUserId);

        // Initialize our doc so others can discover us
        await setDoc(currentCallDoc, { joinedAt: new Date().toISOString() });

        onSnapshot(callsCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                const peerId = change.doc.id;
                const peerData = change.doc.data();

                if (peerId === currentUserId) return; // Skip ourselves

                if (change.type === 'added') {
                    // Someone new joined. Let's create an offer to them.
                    // To avoid glare (both sides offering), we use string comparison of IDs to decide who offers
                    if (currentUserId < peerId) {
                        await initiateOfferToPeer(peerId, stream);
                    }
                }

                if (change.type === 'modified') {
                    // Check if they sent us an offer or answer
                    if (peerData.offer && peerData.offer.targetId === currentUserId && !peerData.answeredBy?.[currentUserId]) {
                        // We received an offer meant for us
                        await handleIncomingOffer(peerId, peerData.offer, stream);
                    }
                    if (peerData.answer && peerData.answer.targetId === currentUserId) {
                        try {
                            const pc = peerConnections.current.get(peerId);
                            if (pc && pc.signalingState !== "stable") {
                                const rtcSessionDescription = new RTCSessionDescription(peerData.answer);
                                await pc.setRemoteDescription(rtcSessionDescription);
                            }
                        } catch (e) {
                            console.error("Error setting answer", e);
                        }
                    }
                }

                if (change.type === 'removed') {
                    // Peer left
                    const pc = peerConnections.current.get(peerId);
                    if (pc) pc.close();
                    peerConnections.current.delete(peerId);
                    setRemoteStreams(prev => {
                        const next = new Map(prev);
                        next.delete(peerId);
                        return next;
                    });
                }
            });
        });
    };

    const createPeerConnection = (peerId: string, stream: MediaStream) => {
        const pc = new RTCPeerConnection(servers);

        // Add our local stream tracks
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        // Listen for remote streams
        pc.ontrack = (event) => {
            setRemoteStreams(prev => {
                const next = new Map(prev);
                next.set(peerId, event.streams[0]);
                return next;
            });
        };

        // ICE Candidates are collected and written to firestore
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                const callerCandidates = collection(db, `calls_${topicId}/${currentUserId}/candidatesTo_${peerId}`);
                await setDoc(doc(callerCandidates), event.candidate.toJSON());
            }
        };

        // Listen for remote ICE candidates
        const remoteCandidates = collection(db, `calls_${topicId}/${peerId}/candidatesTo_${currentUserId}`);
        onSnapshot(remoteCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate).catch(e => console.error(e));
                }
            });
        });

        peerConnections.current.set(peerId, pc);
        return pc;
    };

    const initiateOfferToPeer = async (peerId: string, stream: MediaStream) => {
        const pc = createPeerConnection(peerId, stream);
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const currentCallDoc = doc(db, `calls_${topicId}`, currentUserId);
        const offer = {
            type: offerDescription.type,
            sdp: offerDescription.sdp,
            targetId: peerId
        };

        await updateDoc(currentCallDoc, { offer });
    };

    const handleIncomingOffer = async (peerId: string, offer: any, stream: MediaStream) => {
        const pc = createPeerConnection(peerId, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const currentCallDoc = doc(db, `calls_${topicId}`, currentUserId);
        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
            targetId: peerId
        };

        await updateDoc(currentCallDoc, { answer });

        // Mark the callers offer as answered by us to prevent re-processing
        const callerDoc = doc(db, `calls_${topicId}`, peerId);
        await updateDoc(callerDoc, {
            [`answeredBy.${currentUserId}`]: true
        });
    };

    return {
        localStream,
        remoteStreams,
        isInCall,
        joinCall,
        leaveCall: cleanup,
    };
}
