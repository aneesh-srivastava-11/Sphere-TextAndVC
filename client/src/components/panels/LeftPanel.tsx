"use client";

import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Plus, Hash, Settings } from "lucide-react";
import useSWR from "swr";
import { apiFetch } from "../../lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function LeftPanel() {
    const { account, signOut } = useAuth();
    const pathname = usePathname();

    // Parse spaceId and topicId from URL if available
    const match = pathname.match(/\/spaces\/([^\/]+)(?:\/topics\/([^\/]+))?/);
    const currentSpaceId = match ? match[1] : null;
    const currentTopicId = match && match[2] ? match[2] : null;

    // Fetch Spaces
    const { data: spaces, error: spacesError } = useSWR("/api/spaces", apiFetch);

    // Fetch Topics for the active space
    const { data: topics, error: topicsError } = useSWR(
        currentSpaceId ? `/api/spaces/${currentSpaceId}/topics` : null,
        apiFetch
    );

    return (
        <div className="flex flex-col h-full bg-surface-hover/20">

            {/* Header — User Profile */}
            <div className="h-16 border-b border-border flex items-center justify-between px-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    {account?.avatarUrl ? (
                        <img src={account.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-md bg-surface object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-md bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold text-sm">
                            {account?.displayName?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <span className="text-white font-medium truncate">{account?.displayName}</span>
                </div>
                <button
                    onClick={signOut}
                    className="p-2 text-text-tertiary hover:text-white transition-colors rounded-md hover:bg-white/5"
                    title="Sign out"
                >
                    <LogOut size={16} />
                </button>
            </div>

            {/* Main Nav Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-6">

                {/* Spaces Section */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-2 group">
                        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Spaces</span>
                        <button
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-white transition-all rounded hover:bg-white/5"
                            title="Create Space"
                        // Implement create space modal toggle here
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        {!spaces && !spacesError && <div className="px-2 text-sm text-text-tertiary">Loading spaces...</div>}
                        {spaces?.map((space: any) => {
                            const isActive = currentSpaceId === space.id;
                            return (
                                <a
                                    key={space.id}
                                    href={`/spaces/${space.id}`}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${isActive
                                        ? "bg-brand-500/10 text-brand-500 font-medium"
                                        : "text-text-secondary hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-brand-500" : "bg-transparent"}`}></div>
                                    <span className="truncate">{space.name}</span>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Topics Section (Only if a space is selected) */}
                {currentSpaceId && (
                    <div>
                        <div className="flex items-center justify-between px-2 mb-2 group">
                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Topics</span>
                            <button
                                className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-white transition-all rounded hover:bg-white/5"
                                title="Create Topic"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            {!topics && !topicsError && <div className="px-2 text-sm text-text-tertiary">Loading topics...</div>}
                            {topicsError && <div className="px-2 text-sm text-red-400">Error loading topics</div>}
                            {topics?.length === 0 && <div className="px-2 text-sm text-text-tertiary italic">No topics yet</div>}
                            {topics?.map((topic: any) => {
                                const isActive = currentTopicId === topic.id;
                                return (
                                    <a
                                        key={topic.id}
                                        href={`/spaces/${currentSpaceId}/topics/${topic.id}`}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${isActive
                                            ? "bg-surface text-white font-medium shadow-sm border border-white/5"
                                            : "text-text-secondary hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <Hash size={14} className={isActive ? "text-brand-500" : "text-text-tertiary"} />
                                        <span className="truncate">{topic.name}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
