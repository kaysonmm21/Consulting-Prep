"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user && pathname !== "/login") {
        router.replace("/login");
      }
      if (data.user && pathname === "/login") {
        router.replace("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user && pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, pathname, router]);

  // Still loading auth state
  if (user === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
      </div>
    );
  }

  // On login page without auth — show it
  if (pathname === "/login" && !user) {
    return <>{children}</>;
  }

  // Not authenticated — don't render (redirect is happening)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
