"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  rider: "/rider",
  restaurant: "/restaurant",
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    let destination = "/";
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role && ROLE_REDIRECTS[profile.role]) {
        destination = ROLE_REDIRECTS[profile.role];
      }
    }

    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold mb-2">Welcome back</h1>
          <p className="text-sm text-dacar-ink/60 mb-8">Sign in to your Dacar account.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-dacar-green text-white rounded-lg py-3 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-center mt-4">
            <Link href="/auth/forgot-password" className="text-dacar-green font-medium">
              Forgot password?
            </Link>
          </p>

          <p className="text-sm text-dacar-ink/60 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-dacar-green font-medium">
              Create one
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
