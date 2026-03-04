import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    ],
    iceCandidatePoolSize: 10,
};

export function useWebRTC(topicId: string, currentUserId: string) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [isInCall, setIsInCall] = useState(false);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    const cleanup = useCallback(async () => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        localStreamRef.current = null;
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        setRemoteStreams(new Map());
        setIsInCall(false);
        if (topicId && currentUserId) {
            try { await deleteDoc(doc(db, `calls_${topicId}`, currentUserId)); } catch { }
        }
    }, [topicId, currentUserId]);

    const createPeerConnection = (peerId: string, stream: MediaStream) => {
        const pc = new RTCPeerConnection(servers);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            setRemoteStreams(prev => new Map(prev).set(peerId, event.streams[0]));
        };

        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                const col = collection(db, `calls_${topicId}/${currentUserId}/candidatesTo_${peerId}`);
                await setDoc(doc(col), event.candidate.toJSON());
            }
        };

        onSnapshot(collection(db, `calls_${topicId}/${peerId}/candidatesTo_${currentUserId}`), (snap) => {
            snap.docChanges().forEach(change => {
                if (change.type === 'added') {
                    pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => { });
                }
            });
        });

        peerConnections.current.set(peerId, pc);
        return pc;
    };

    const joinCall = async () => {
        setIsInCall(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;

        const currentCallDoc = doc(db, `calls_${topicId}`, currentUserId);
        await setDoc(currentCallDoc, { joinedAt: new Date().toISOString() });

        const callsCollection = collection(db, `calls_${topicId}`);
        onSnapshot(callsCollection, async (snapshot) => {
            for (const change of snapshot.docChanges()) {
                const peerId = change.doc.id;
                const peerData = change.doc.data();
                if (peerId === currentUserId) continue;

                if (change.type === 'added' && currentUserId < peerId) {
                    const pc = createPeerConnection(peerId, stream);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await updateDoc(currentCallDoc, { offer: { ...offer, targetId: peerId } });
                }

                if (change.type === 'modified') {
                    if (peerData.offer?.targetId === currentUserId && !peerData.answeredBy?.[currentUserId]) {
                        const pc = createPeerConnection(peerId, stream);
                        await pc.setRemoteDescription(new RTCSessionDescription(peerData.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await updateDoc(currentCallDoc, { answer: { ...answer, targetId: peerId } });
                        try { await updateDoc(doc(db, `calls_${topicId}`, peerId), { [`answeredBy.${currentUserId}`]: true }); } catch { }
                    }
                    if (peerData.answer?.targetId === currentUserId) {
                        const pc = peerConnections.current.get(peerId);
                        if (pc && pc.signalingState !== 'stable') {
                            await pc.setRemoteDescription(new RTCSessionDescription(peerData.answer)).catch(() => { });
                        }
                    }
                }

                if (change.type === 'removed') {
                    peerConnections.current.get(peerId)?.close();
                    peerConnections.current.delete(peerId);
                    setRemoteStreams(prev => { const n = new Map(prev); n.delete(peerId); return n; });
                }
            }
        });
    };

    return { localStream, remoteStreams, isInCall, joinCall, leaveCall: cleanup };
}
