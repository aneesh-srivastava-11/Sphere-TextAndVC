"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import RequireAuth from "../components/auth/RequireAuth";

export default function Home() {
  const { account, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && account?.displayName) {
      router.replace("/spaces");
    }
  }, [account, loading, router]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </RequireAuth>
  );
}
