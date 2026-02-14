import { createBrowserClient as createBrowser } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build/prerender when env vars are missing
    return createBrowser(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }
  return createBrowser(supabaseUrl, supabaseAnonKey);
}
