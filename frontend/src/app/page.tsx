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

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchSpaces();
    }
  }, [user, fetchConversations, fetchSpaces]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', (message: any) => addMessage(message));
    socket.on('message_edited', (message: any) => updateMessage(message));
    socket.on('message_deleted', (data: any) => removeMessage(data.messageId));
    socket.on('reaction_updated', (data: any) => updateReaction(data));
    socket.on('new_thread_reply', (data: any) => addThreadReply(data.reply));
    socket.on('user_typing', (data: any) => {
      setTypingUser(data.conversationId, data.userId);
      setTimeout(() => clearTypingUser(data.conversationId, data.userId), 3000);
    });
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
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top center, #171717 0%, #000000 100%)',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#fff',
        position: 'relative',
      }}>
        {/* Gray mesh */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(at 0% 0%, rgba(255,255,255,0.03) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(255,255,255,0.02) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(255,255,255,0.01) 0, transparent 50%)',
        }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 14px', color: '#fff' }} />
          <p style={{ fontSize: 10, color: '#525252', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Initializing Core...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      background: 'radial-gradient(circle at top center, #171717 0%, #000000 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
      position: 'relative',
    }}>
      {/* Gray mesh */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(255,255,255,0.03) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(255,255,255,0.02) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(255,255,255,0.01) 0, transparent 50%)',
      }} />

      {/* Call overlay */}
      {isInCall && <CallView />}

      {/* Main layout */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex' }}>
        <Sidebar />
        <CenterPanel />
        {activeConversation && <RightPanel />}
      </div>
    </div>
  );
}
