"use client";

import useSWR from "swr";
import { apiFetch } from "../../../../lib/api";
import { useParams } from "next/navigation";
import { Plus, Hash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SpacePage() {
    const { spaceId } = useParams() as { spaceId: string };
    const [newTopicName, setNewTopicName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const { data: space } = useSWR(`/api/spaces/${spaceId}`, apiFetch);
    const { data: topics, mutate } = useSWR(`/api/spaces/${spaceId}/topics`, apiFetch);

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopicName) return;

        try {
            await apiFetch(`/api/spaces/${spaceId}/topics`, {
                method: "POST",
                body: JSON.stringify({ spaceId, name: newTopicName })
            });
            setNewTopicName("");
            setIsCreating(false);
            mutate(); // Refresh SWR cache
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full relative">
            <div className="max-w-3xl mx-auto w-full">
                {space && (
                    <div className="mb-10 animate-fade-in">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">Welcome to <span className="text-brand-500">{space.name}</span></h1>
                        <p className="text-text-secondary">{space.description || "Select a topic from the left panel to begin chatting, or create a new one."}</p>
                    </div>
                )}

                <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-slide-up">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Hash className="text-brand-500" size={24} />
                            Topics in this Space
                        </h2>
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className="text-white hover:text-brand-400 p-2 bg-white/5 rounded-lg border border-white/5 transition-colors"
                            title="Create Topic"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {isCreating && (
                        <form onSubmit={handleCreateTopic} className="mb-6 flex gap-3">
                            <input
                                autoFocus
                                required
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                type="text"
                                placeholder="e.g. general"
                                className="flex-1 bg-surface-hover border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                            />
                            <button type="submit" className="primary-button px-6 py-2 rounded-xl text-sm font-medium">Create</button>
                        </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {topics?.map((topic: any) => (
                            <Link
                                key={topic.id}
                                href={`/spaces/${spaceId}/topics/${topic.id}`}
                                className="flex flex-col p-4 rounded-xl border border-white/5 bg-surface-hover/50 hover:bg-surface-hover transition-colors group"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Hash size={16} className="text-text-tertiary group-hover:text-brand-500 transition-colors" />
                                    <span className="font-semibold text-white">{topic.name}</span>
                                </div>
                                <span className="text-xs text-text-tertiary">Join the conversation &rarr;</span>
                            </Link>
                        ))}
                        {topics?.length === 0 && !isCreating && (
                            <div className="col-span-full py-8 text-center text-text-tertiary">
                                No topics yet. Create one to start collaborating!
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
