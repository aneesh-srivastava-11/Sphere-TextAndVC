export interface Account {
    id: string;
    supabase_uid: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    status: string;
    created_at: string;
    role?: string;
}

export interface Space {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    created_by: string;
    created_at: string;
    role?: string;
    topics?: Conversation[];
    members?: Account[];
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'topic';
    title: string | null;
    avatar_url: string | null;
    created_by: string;
    space_id: string | null;
    created_at: string;
    updated_at: string;
    participants?: Account[];
    lastMessage?: Message;
}

export interface Message {
    id: string;
    conversation_id: string;
    author_id: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
    edited_at: string | null;
    author?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
    reactions?: Reaction[];
    threads?: { count: number }[];
    file_attachments?: FileAttachment[];
    _blocked?: boolean;
}

export interface ThreadReply {
    id: string;
    parent_message_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
}

export interface Reaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
}

export interface FileAttachment {
    id: string;
    message_id: string;
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
}

export interface CallSession {
    id: string;
    conversation_id: string;
    started_by: string;
    status: 'active' | 'ended';
    started_at: string;
    ended_at: string | null;
}

export interface PeerConnection {
    userId: string;
    socketId: string;
    displayName: string;
    connection: RTCPeerConnection;
    stream?: MediaStream;
    isMicOn?: boolean;
    isCameraOn?: boolean;
}
