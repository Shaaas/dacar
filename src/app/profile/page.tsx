"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type Address = {
  id: string;
  label: string | null;
  address_text: string;
  is_default: boolean;
};

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/login");
        return;
      }
      setUser(userData.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name ?? "");
        setPhone(profileData.phone ?? "");
      }

      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("profile_id", userData.user.id)
        .order("is_default", { ascending: false });

      if (addressData) setAddresses(addressData);

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);

    if (updateError) setError(updateError.message);
    setSaving(false);
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newAddress.trim()) return;

    const { data, error: insertError } = await supabase
      .from("addresses")
      .insert({
        profile_id: user.id,
        label: newLabel || "Address",
        address_text: newAddress,
        is_default: addresses.length === 0,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) setAddresses([...addresses, data]);
    setNewLabel("");
    setNewAddress("");
  }

  async function handleDeleteAddress(id: string) {
    const { error: deleteError } = await supabase.from("addresses").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setAddresses(addresses.filter((a) => a.id !== id));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12 max-w-2xl mx-auto w-full">
        <h1 className="font-display text-3xl font-semibold mb-8">Your profile</h1>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mb-12">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-dacar-ink/50 mb-1 block">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-dacar-ink/50 mb-1 block">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-dacar-ink/50 mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="w-full border border-dacar-line rounded-lg px-4 py-3 text-sm bg-dacar-bg text-dacar-ink/50"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-dacar-green text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <div className="mb-12">
          <h2 className="font-display text-xl font-semibold mb-4">Addresses</h2>

          <div className="flex flex-col gap-3 mb-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-center justify-between border border-dacar-line rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {addr.label} {addr.is_default && <span className="text-dacar-green text-xs">(default)</span>}
                  </p>
                  <p className="text-sm text-dacar-ink/60">{addr.address_text}</p>
                </div>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-sm text-dacar-ink/50">No addresses saved yet.</p>
            )}
          </div>

          <form onSubmit={handleAddAddress} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Label (e.g. Home, Work)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <input
              type="text"
              placeholder="Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="border border-dacar-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-dacar-green"
            />
            <button
              type="submit"
              className="self-start border border-dacar-green text-dacar-green rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-dacar-green-tint transition"
            >
              Add address
            </button>
          </form>
        </div>

        <button
          onClick={handleSignOut}
          className="text-sm text-dacar-ink/60 hover:text-dacar-ink underline"
        >
          Sign out
        </button>
      </main>
      <Footer />
    </div>
  );
}
