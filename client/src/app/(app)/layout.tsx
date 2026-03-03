"use client";

import RequireAuth from "../../components/auth/RequireAuth";
import LeftPanel from "../../components/panels/LeftPanel";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { account, loading } = useAuth();
    const router = useRouter();

    // If we are logged in but lack a display name, redirect to setup
    useEffect(() => {
        if (!loading && account && !account.displayName) {
            router.replace("/setup-name");
        }
    }, [account, loading, router]);

    return (
        <RequireAuth>
            <div className="flex h-screen w-screen overflow-hidden bg-background">
                {/* Left Nav Panel - Fixed width */}
                <div className="w-[280px] sm:w-[320px] flex-shrink-0 border-r border-border bg-surface flex flex-col h-full z-10 transition-transform duration-300">
                    <LeftPanel />
                </div>

                {/* Center/Right Content Area */}
                <div className="flex-1 flex overflow-hidden relative z-0">
                    {children}
                </div>
            </div>
        </RequireAuth>
    );
}
