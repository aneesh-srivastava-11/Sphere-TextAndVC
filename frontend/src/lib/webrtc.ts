const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function createPeerConnection(): RTCPeerConnection {
    return new RTCPeerConnection(ICE_SERVERS);
}

export async function getUserMedia(video = true, audio = true): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ video, audio });
}

export async function getDisplayMedia(): Promise<MediaStream> {
    return navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
}

export function addStreamTracks(pc: RTCPeerConnection, stream: MediaStream) {
    stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
    });
}

export function replaceTrack(
    pc: RTCPeerConnection,
    oldTrack: MediaStreamTrack,
    newTrack: MediaStreamTrack
) {
    const sender = pc.getSenders().find(s => s.track === oldTrack);
    if (sender) {
        sender.replaceTrack(newTrack);
    }
}
