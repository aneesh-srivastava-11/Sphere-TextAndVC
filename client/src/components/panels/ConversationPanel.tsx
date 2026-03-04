"use client";

import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { apiFetch } from "../../lib/api";
import { useParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { PanelRight, Hash, Pin, Paperclip, Send, Video } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import VideoRoom from "../video/VideoRoom";

export default function ConversationPanel() {
    const { topicId, spaceId } = useParams() as { topicId: string, spaceId: string };
    const { account } = useAuth();
    const toggleRightPanel = useUiStore((state) => state.toggleRightPanel);
    const isRightPanelOpen = useUiStore((state) => state.isRightPanelOpen);

    const [isCallActive, setIsCallActive] = useState(false);
    const [liveMessages, setLiveMessages] = useState<any[]>([]);
    const [composerText, setComposerText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch initial history
    const { data: historyMessages, error } = useSWR(
        topicId ? `/api/topics/${topicId}/messages` : null,
        apiFetch
    );

    const { data: topic } = useSWR(topicId ? `/api/topics/${topicId}` : null, apiFetch);

    // Combine SWR history with live Firestore messages
    const allMessages = [...(historyMessages || []), ...liveMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages]);

    // Realtime Firestore Listener
    useEffect(() => {
        if (!topicId || !auth.currentUser) return;

        const q = query(
            collection(db, "messages"),
            where("topicId", "==", topicId),
            orderBy("createdAt", "desc"),
            limit(10) // Only care about catching new incoming messages to append to history
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            // Reverse so chronological 
            fetched.reverse();

            setLiveMessages(prev => {
                const combined = [...prev];
                fetched.forEach(msg => {
                    // Prevent duplicates from SWR or previous live messages
                    const inHistory = historyMessages?.find((m: any) => m.id === msg.id);
                    const inLive = combined.find((m: any) => m.id === msg.id);
                    if (!inHistory && !inLive && msg.createdAt) {
                        combined.push(msg);
                    }
                });
                return combined;
            });
        });

        return () => unsubscribe();
    }, [topicId, historyMessages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composerText.trim() || !topicId) return;

        const content = composerText.trim();
        setComposerText("");

        try {
            await apiFetch(`/api/topics/${topicId}/messages`, {
                method: "POST",
                body: JSON.stringify({ topicId, content })
            });

            // The onSnapshot listener will automatically pick up this new message and append it!
        } catch {
            // error handled silently
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-r border-border min-w-0">

            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Hash className="text-text-tertiary" size={20} />
                    <h2 className="text-lg font-bold text-white">{topic?.name || "Topic"}</h2>
                </div>
                <div className="flex items-center gap-4">
                    {!isCallActive && (
                        <button
                            onClick={() => setIsCallActive(true)}
                            className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md shadow-brand-500/20"
                        >
                            <Video size={16} />
                            <span>Join Call</span>
                        </button>
                    )}
                    <button
                        onClick={toggleRightPanel}
                        className={`p-2 rounded-md transition-colors ${isRightPanelOpen ? 'bg-brand-500/20 text-brand-500' : 'text-text-tertiary hover:text-white hover:bg-white/5'}`}
                        title="Toggle Context Panel"
                    >
                        <PanelRight size={20} />
                    </button>
                </div>
            </div>

            {/* Video Call Overlay */}
            {isCallActive && account && topicId && (
                <div className="flex-shrink-0 animate-in slide-in-from-top-4 fade-in duration-300">
                    <VideoRoom
                        topicId={topicId}
                        currentUserId={account.id}
                        onClose={() => setIsCallActive(false)}
                    />
                </div>
            )}

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {allMessages.map((msg, idx) => {
                    const isMe = msg.authorId === account?.id;

                    // Ghost Block Presentation
                    if (msg.isGhostBlocked) {
                        return (
                            <div key={msg.id} className="text-xs text-text-tertiary italic p-3 bg-white/5 rounded-lg border border-white/5 mx-auto max-w-sm text-center">
                                Message from a blocked user
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`mb-1 flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                <span className="text-sm font-semibold text-text-secondary">
                                    {isMe ? "You" : msg.authorId} {/* Mapped author displayName missing in MVP payload, would need joining or caching */}
                                </span>
                                <span className="text-xs text-text-tertiary">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className={`
                  px-4 py-3 rounded-2xl max-w-[80%] text-sm
                  ${isMe
                                    ? "bg-brand-600 text-white rounded-tr-sm"
                                    : "bg-surface text-white rounded-tl-sm border border-white/5 shadow-sm"
                                }
                `}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-4 bg-surface/80 backdrop-blur-sm border-t border-border flex-shrink-0">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative bg-background border border-border rounded-xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all flex items-end p-1">
                    <button type="button" className="p-3 text-text-tertiary hover:text-white transition-colors">
                        <Paperclip size={20} />
                    </button>

                    <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder={`Message #${topic?.name || "topic"}`}
                        className="flex-1 bg-transparent text-white placeholder-text-tertiary py-3 px-2 focus:outline-none resize-none min-h-[44px] max-h-32 custom-scrollbar"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={!composerText.trim()}
                        className="p-3 text-brand-500 hover:text-brand-400 disabled:text-text-tertiary transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

        </div>
    );
}
