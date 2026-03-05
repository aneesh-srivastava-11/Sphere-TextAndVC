const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function getAuthHeaders(): Promise<HeadersInit> {
    // Import dynamically to avoid circular deps
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();

    return {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = await getAuthHeaders();

    // Don't override Content-Type if it's FormData (browser sets the boundary for multipart)
    const combinedHeaders: HeadersInit = { ...headers, ...options.headers };
    if (options.body instanceof FormData) {
        delete (combinedHeaders as any)['Content-Type'];
    }

    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: combinedHeaders,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return res.json();
}

export const api = {
    // Auth
    syncUser: () => request<any>('/api/auth/sync', { method: 'POST' }),

    // Storage
    uploadFile: async (file: File, bucket: 'avatars' | 'attachments') => {
        const { supabase } = await import('./supabase');
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;
    },

    // Users
    getProfile: () => request<any>('/api/users/me'),
    updateProfile: (data: any) => request<any>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    searchUsers: (q: string) => request<any[]>(`/api/users/search?q=${encodeURIComponent(q)}`),
    blockUser: (id: string) => request<any>(`/api/users/block/${id}`, { method: 'POST' }),
    unblockUser: (id: string) => request<any>(`/api/users/block/${id}`, { method: 'DELETE' }),

    // Nicknames
    getNicknames: () => request<any[]>('/api/users/nicknames/all'),
    setNickname: (targetUserId: string, nickname: string) =>
        request<any>(`/api/users/nicknames/${targetUserId}`, { method: 'PUT', body: JSON.stringify({ nickname }) }),
    removeNickname: (targetUserId: string) =>
        request<any>(`/api/users/nicknames/${targetUserId}`, { method: 'DELETE' }),

    // Conversations
    getConversations: () => request<any[]>('/api/conversations'),
    getConversation: (id: string) => request<any>(`/api/conversations/${id}`),
    createDM: (userId: string) => request<any>('/api/conversations/dm', { method: 'POST', body: JSON.stringify({ userId }) }),
    createGroup: (title: string, memberIds: string[]) =>
        request<any>('/api/conversations/group', { method: 'POST', body: JSON.stringify({ title, memberIds }) }),
    createTopic: (spaceId: string, title: string) =>
        request<any>('/api/conversations/topic', { method: 'POST', body: JSON.stringify({ spaceId, title }) }),
    updateConversation: (id: string, data: any) =>
        request<any>(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addParticipant: (convId: string, userId: string) =>
        request<any>(`/api/conversations/${convId}/participants`, { method: 'POST', body: JSON.stringify({ userId }) }),
    removeParticipant: (convId: string, userId: string) =>
        request<any>(`/api/conversations/${convId}/participants/${userId}`, { method: 'DELETE' }),

    // Messages
    getMessages: (convId: string, before?: string) =>
        request<any[]>(`/api/messages/${convId}${before ? `?before=${before}` : ''}`),
    sendMessage: (convId: string, content: string, attachment?: { url: string, name: string, size: number, type: string }) =>
        request<any>(`/api/messages/${convId}`, { method: 'POST', body: JSON.stringify({ content, attachment }) }),
    editMessage: (msgId: string, content: string) =>
        request<any>(`/api/messages/${msgId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
    deleteMessage: (msgId: string) =>
        request<any>(`/api/messages/${msgId}`, { method: 'DELETE' }),
    toggleReaction: (msgId: string, emoji: string) =>
        request<any>(`/api/messages/${msgId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
    getPinnedMessages: (convId: string) => request<any[]>(`/api/messages/${convId}/pinned`),
    pinMessage: (convId: string, msgId: string) =>
        request<any>(`/api/messages/${convId}/pin/${msgId}`, { method: 'POST' }),
    unpinMessage: (convId: string, msgId: string) =>
        request<any>(`/api/messages/${convId}/pin/${msgId}`, { method: 'DELETE' }),
    getThreadReplies: (msgId: string) => request<any[]>(`/api/messages/threads/${msgId}`),
    addThreadReply: (msgId: string, content: string) =>
        request<any>(`/api/messages/threads/${msgId}`, { method: 'POST', body: JSON.stringify({ content }) }),

    // Spaces
    getSpaces: () => request<any[]>('/api/spaces'),
    getSpace: (id: string) => request<any>(`/api/spaces/${id}`),
    createSpace: (name: string, description?: string) =>
        request<any>('/api/spaces', { method: 'POST', body: JSON.stringify({ name, description }) }),
    joinSpace: (id: string) => request<any>(`/api/spaces/${id}/join`, { method: 'POST' }),
    leaveSpace: (id: string) => request<any>(`/api/spaces/${id}/leave`, { method: 'DELETE' }),

    // Moderation
    reportMessage: (messageId: string, reason: string) =>
        request<any>('/api/moderation/report', { method: 'POST', body: JSON.stringify({ messageId, reason }) }),
    muteUser: (conversationId: string, userId: string, durationMinutes?: number) =>
        request<any>('/api/moderation/mute', { method: 'POST', body: JSON.stringify({ conversationId, userId, durationMinutes }) }),
    banUser: (conversationId: string, userId: string) =>
        request<any>('/api/moderation/ban', { method: 'POST', body: JSON.stringify({ conversationId, userId }) }),
    removeUser: (conversationId: string, userId: string) =>
        request<any>('/api/moderation/remove', { method: 'POST', body: JSON.stringify({ conversationId, userId }) }),

    // Calls
    startCall: (conversationId: string) =>
        request<any>('/api/calls/start', { method: 'POST', body: JSON.stringify({ conversationId }) }),
    endCall: (callId: string) => request<any>(`/api/calls/${callId}/end`, { method: 'POST' }),
    getActiveCall: (conversationId: string) => request<any>(`/api/calls/active/${conversationId}`),
};
