"use client";

import useSWR from "swr";
import { apiFetch } from "../../../lib/api";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SpacesBrowser() {
    const { data: spaces, error } = useSWR("/api/spaces", apiFetch);
    const [isCreating, setIsCreating] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState("");
    const [newSpaceSlug, setNewSpaceSlug] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSpaceName || !newSpaceSlug) return;

        try {
            await apiFetch("/api/spaces", {
                method: "POST",
                body: JSON.stringify({ name: newSpaceName, slug: newSpaceSlug, isPrivate: false })
            });
            window.location.reload(); // Simple refresh for MVP
        } catch (err) {
            console.error(err);
        }
    };

    if (!spaces && !error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent flex rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Spaces</h1>
                        <p className="text-text-secondary">Join existing spaces or create your own.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="primary-button px-4 py-2 rounded-xl text-sm font-medium flex gap-2 items-center"
                    >
                        <Plus size={16} /> New Space
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="mb-8 p-6 glass-panel rounded-2xl animate-slide-up flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-text-tertiary mb-1 uppercase font-semibold">Space Name</label>
                            <input
                                autoFocus
                                value={newSpaceName}
                                onChange={e => {
                                    setNewSpaceName(e.target.value);
                                    setNewSpaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                                }}
                                placeholder="e.g. Engineering"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:border-brand-500 outline-none"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-text-tertiary mb-1 uppercase font-semibold">URL Slug</label>
                            <input
                                value={newSpaceSlug}
                                onChange={e => setNewSpaceSlug(e.target.value)}
                                placeholder="engineering"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white outline-none opacity-50 cursor-not-allowed"
                                readOnly
                            />
                        </div>
                        <div className="flex items-end self-end sm:self-auto h-[42px] mt-auto sm:mt-5">
                            <button type="submit" className="primary-button h-[42px] px-6 rounded-lg text-sm">Create</button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spaces?.map((space: any) => (
                        <Link
                            key={space.id}
                            href={`/spaces/${space.id}`}
                            className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] rounded-full group-hover:bg-brand-500/10 transition-colors"></div>
                            <h3 className="text-lg font-bold text-white mb-1 relative z-10">{space.name}</h3>
                            <p className="text-text-secondary text-sm mb-4 relative z-10">{space.description || "A workspace for your team."}</p>

                            <div className="flex items-center text-xs font-medium text-brand-500 relative z-10">
                                Enter Space &rarr;
                            </div>
                        </Link>
                    ))}
                    {spaces?.length === 0 && (
                        <div className="col-span-full py-12 text-center text-text-tertiary glass-panel rounded-2xl">
                            No spaces found. Create one to get started!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
