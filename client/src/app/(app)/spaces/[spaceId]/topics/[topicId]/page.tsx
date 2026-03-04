"use client";

import ConversationPanel from "@/components/panels/ConversationPanel";
import ContextPanel from "@/components/panels/ContextPanel";
import { useUiStore } from "@/store/uiStore";

export default function TopicPage({ params }: { params: { spaceId: string, _topicId: string } }) { // _topicId to avoid shadowing but we can just use useParams
    const isRightPanelOpen = useUiStore((state) => state.isRightPanelOpen);

    return (
        <>
            {/* Center Panel - Conversation Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative ${isRightPanelOpen ? 'mr-[320px]' : ''}`}>
                <ConversationPanel />
            </div>

            {/* Right Panel - Context Area (Pinned, Files) */}
            <div
                className={`absolute top-0 right-0 h-full w-[320px] border-l border-border bg-surface flex flex-col z-20 transition-transform duration-300 ${isRightPanelOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
                    }`}
            >
                <ContextPanel />
            </div>
        </>
    );
}
