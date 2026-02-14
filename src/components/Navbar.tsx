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
    <nav className="sticky top-0 z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold uppercase tracking-wider text-black">Case</span>
          <span className="text-xl font-bold uppercase tracking-wider text-black">Coach</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link
            href="/practice"
            className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
              pathname?.startsWith("/practice")
                ? "text-black border-b-2 border-[#00A651] pb-0.5"
                : "text-black hover:border-b-2 hover:border-black hover:pb-0.5"
            }`}
          >
            Practice
          </Link>
          <Link
            href="/"
            className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
              pathname === "/"
                ? "text-black border-b-2 border-[#00A651] pb-0.5"
                : "text-black hover:border-b-2 hover:border-black hover:pb-0.5"
            }`}
          >
            Dashboard
          </Link>
          {user && (
            <>
              <span className="text-xs text-gray-500">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-xs font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:text-black"
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
