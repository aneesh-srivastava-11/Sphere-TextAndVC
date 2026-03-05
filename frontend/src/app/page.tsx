'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useMessageStore } from '@/stores/messageStore';
import { useCallStore } from '@/stores/callStore';
import { getSocket } from '@/lib/socket';
import Sidebar from '@/components/layout/Sidebar';
import CenterPanel from '@/components/layout/CenterPanel';
import RightPanel from '@/components/layout/RightPanel';
import CallView from '@/components/call/CallView';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading, initialized, initialize } = useAuthStore();
  const { fetchConversations, fetchSpaces, activeConversation } = useConversationStore();
  const { addMessage, updateMessage, removeMessage, updateReaction, addThreadReply, setTypingUser, clearTypingUser } = useMessageStore();
  const { isInCall, handleUserJoined, handleUserLeft, handleOffer, handleAnswer, handleIceCandidate } = useCallStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/login');
    }
  }, [initialized, loading, user, router]);

  // Fetch data once authenticated
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchSpaces();
    }
  }, [user, fetchConversations, fetchSpaces]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (message: any) => {
      addMessage(message);
    });

    socket.on('message_edited', (message: any) => {
      updateMessage(message);
    });

    socket.on('message_deleted', (data: any) => {
      removeMessage(data.messageId);
    });

    socket.on('reaction_updated', (data: any) => {
      updateReaction(data);
    });

    socket.on('new_thread_reply', (data: any) => {
      addThreadReply(data.reply);
    });

    socket.on('user_typing', (data: any) => {
      setTypingUser(data.conversationId, data.userId);
      setTimeout(() => clearTypingUser(data.conversationId, data.userId), 3000);
    });

    // Call events
    socket.on('call_user_joined', handleUserJoined);
    socket.on('call_user_left', handleUserLeft);
    socket.on('call_offer', handleOffer);
    socket.on('call_answer', handleAnswer);
    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('reaction_updated');
      socket.off('new_thread_reply');
      socket.off('user_typing');
      socket.off('call_user_joined');
      socket.off('call_user_left');
      socket.off('call_offer');
      socket.off('call_answer');
      socket.off('ice_candidate');
    };
  }, [user, addMessage, updateMessage, removeMessage, updateReaction, addThreadReply, setTypingUser, clearTypingUser, handleUserJoined, handleUserLeft, handleOffer, handleAnswer, handleIceCandidate]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center animate-fade-in">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading Sphere...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Call overlay */}
      {isInCall && <CallView />}

      {/* Main layout */}
      <Sidebar />
      <CenterPanel />
      {activeConversation && <RightPanel />}
    </div>
  );
}
