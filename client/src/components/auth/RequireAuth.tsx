"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, account, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                if (pathname !== "/login") {
                    router.push("/login");
                }
            } else if (account) {
                if (!account.displayName && pathname !== "/setup-name") {
                    router.push("/setup-name");
                } else if (account.displayName && (pathname === "/login" || pathname === "/setup-name")) {
                    router.push("/");
                }
            }
        }
    }, [user, account, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Prevent flash of protected content while redirecting
    if (!user && pathname !== "/login") return null;
    if (user && account && !account.displayName && pathname !== "/setup-name") return null;

    return <>{children}</>;
}
