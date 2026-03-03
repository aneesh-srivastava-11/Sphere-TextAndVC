"use client";

import { useUiStore } from "../../store/uiStore";
import { X, Pin, File as FileIcon, Search } from "lucide-react";

export default function ContextPanel() {
    const setRightPanelOpen = useUiStore((state) => state.setRightPanelOpen);

    return (
        <div className="flex flex-col h-full bg-surface-hover/30">

            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
                <h3 className="text-white font-semibold">Topic Context</h3>
                <button
                    onClick={() => setRightPanelOpen(false)}
                    className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar flex flex-col gap-8">

                {/* Search Dummy */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search in topic..."
                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none transition-colors"
                    />
                </div>

                {/* Pinned Messages */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Pin size={16} className="text-brand-500" />
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Pinned Messages</h4>
                    </div>
                    <div className="glass-panel p-4 rounded-xl">
                        <div className="text-xs text-text-tertiary text-center p-2">
                            No pinned messages yet.
                        </div>
                    </div>
                </section>

                {/* Files & Links */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <FileIcon size={16} className="text-blue-500" />
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Files</h4>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="glass-panel p-3 rounded-xl flex items-center gap-3 group cursor-pointer hover:bg-surface transition-colors">
                            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <FileIcon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">Q1_Report.pdf</p>
                                <p className="text-[10px] text-text-tertiary mt-0.5">Alex.D • 2.4 MB</p>
                            </div>
                        </div>
                        <div className="text-xs text-text-tertiary text-center p-4">
                            Attach files in the chat to see them here.
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
