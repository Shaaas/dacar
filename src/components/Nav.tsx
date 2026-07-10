"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import type { User } from "@supabase/supabase-js";

export default function Nav() {
  const supabase = createClient();
  const router = useRouter();
  const { count } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setRole(profile?.role ?? "customer");
      }
      setLoading(false);
    }
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setRole(null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isCustomer = !user || (role !== "admin" && role !== "rider" && role !== "restaurant");

  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-6">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight">
        dacar
      </Link>
      <div className="flex items-center gap-4">
        {isCustomer && (
          <Link
            href="/cart"
            className="relative text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
          >
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-3 bg-dacar-green text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        )}

        {role === "rider" && (
          <Link
            href="/rider"
            className="text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
          >
            Deliveries
          </Link>
        )}

        {role === "restaurant" && (
          <Link
            href="/restaurant"
            className="text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
          >
            Kitchen
          </Link>
        )}

        {role === "admin" && (
          <Link
            href="/admin"
            className="text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
          >
            Dashboard
          </Link>
        )}

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
