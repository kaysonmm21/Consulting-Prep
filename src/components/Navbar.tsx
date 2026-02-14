"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#1B2A4A]">Case</span>
          <span className="text-xl font-bold text-[#00A651]">Coach</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link
            href="/practice"
            className={`text-sm font-medium transition-colors ${
              pathname?.startsWith("/practice")
                ? "text-[#00A651]"
                : "text-[#1B2A4A] hover:text-[#00A651]"
            }`}
          >
            Practice
          </Link>
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-[#00A651]"
                : "text-[#1B2A4A] hover:text-[#00A651]"
            }`}
          >
            Dashboard
          </Link>
          {user && (
            <>
              <span className="text-xs text-[#6B7280]">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:text-[#00A651]"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
