"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Nav() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-6">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight">
        dacar
      </Link>
      <div className="flex items-center gap-4">
        {loading ? null : user ? (
          <>
            <Link
              href="/profile"
              className="text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium bg-dacar-ink text-white px-4 py-2 rounded-full hover:bg-dacar-ink/80 transition"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium bg-dacar-green text-white px-4 py-2 rounded-full hover:bg-dacar-green-deep transition"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
