"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Routes that don't require authentication.
const PUBLIC_ROUTES = ["/", "/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      if (!data.user && !isPublic) {
        // Unauthenticated on a protected route → send to login.
        router.replace("/login");
      }

      if (data.user && (pathname === "/" || pathname === "/login")) {
        // Authenticated user hits landing or login → send to dashboard.
        router.replace("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user && !isPublic) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, pathname, router, isPublic]);

  // Still resolving auth state — show spinner only on protected routes.
  if (user === undefined && !isPublic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
      </div>
    );
  }

  // Public route or authenticated — render children.
  if (isPublic || user) {
    return <>{children}</>;
  }

  // Protected route, not authenticated — render nothing while redirecting.
  return null;
}
