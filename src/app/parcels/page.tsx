"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackLink from "@/components/BackLink";
import type { User } from "@supabase/supabase-js";

export default function ParcelsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("parcel_requests").insert({
      profile_id: user.id,
      pickup_address: pickup,
      dropoff_address: dropoff,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      notes,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setPickup("");
    setDropoff("");
    setRecipientName("");
    setRecipientPhone("");
    setNotes("");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dacar-green mb-2">
          Point to Point
        </p>
        <BackLink />
        <h1 className="font-display text-3xl font-semibold mb-8">Send a parcel</h1>

        {checkingAuth ? null : !user ? (
          <div className="border border-dacar-line rounded-2xl p-10 text-center text-dacar-ink/60 max-w-md">
            <p className="mb-4">Sign in to send a parcel.</p>
            <Link
              href="/auth/login"
              className="inline-block bg-dacar-green text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-dacar-green-deep transition"
            >
              Sign in
            </Link>
          </div>
        ) : success ? (
          <div className="border border-dacar-line rounded-2xl p-10 text-center max-w-md">
            <p className="font-display text-xl font-semibold mb-2">Request sent</p>
            <p className="text-sm text-dacar-ink/60">
              We&apos;ll be in touch to confirm pickup.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
            <input
              type="text"
              placeholder="Pickup address"
              required
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <input
              type="text"
              placeholder="Drop-off address"
              required
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <input
              type="text"
              placeholder="Recipient name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <input
              type="tel"
              placeholder="Recipient phone"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green resize-none"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-dacar-green text-white rounded-lg py-3 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send parcel request"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}


