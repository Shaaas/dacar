"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackLink from "@/components/BackLink";

type Restaurant = {
  id: string;
  name: string;
  is_open: boolean;
  address: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminRestaurantsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .order("name");
    setRestaurants(restaurantData ?? []);

    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("type", "food");
    setCategories(categoryData ?? []);
    if (categoryData && categoryData.length > 0) setCategoryId(categoryData[0].id);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      if (profile?.role !== "admin") {
        setNotAdmin(true);
        setChecking(false);
        return;
      }
      await loadData();
      setChecking(false);
    }
    init();
  }, [supabase, router, loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("restaurants").insert({
      name,
      address,
      category_id: categoryId || null,
      is_open: true,
    });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    setName("");
    setAddress("");
    await loadData();
    setSaving(false);
  }

  async function toggleOpen(id: string, isOpen: boolean) {
    await supabase.from("restaurants").update({ is_open: !isOpen }).eq("id", id);
    await loadData();
  }

  if (checking) return null;

  if (notAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 px-6 md:px-12 py-12 max-w-md mx-auto w-full text-center">
          <p className="text-dacar-ink/60">You don&apos;t have admin access.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12">
        <BackLink href="/admin" label="Orders" />
        <h1 className="font-display text-3xl font-semibold mb-8">Admin — Restaurants</h1>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 mb-8 max-w-2xl">
          <input
            type="text"
            placeholder="Restaurant name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-dacar-line rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[180px]"
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border border-dacar-line rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[180px]"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-dacar-line rounded-lg px-4 py-2.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="bg-dacar-green text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add restaurant"}
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="border border-dacar-line rounded-xl p-5 bg-dacar-surface flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-sm">{r.name}</p>
                <p className="text-sm text-dacar-ink/60">{r.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/restaurants/${r.id}`}
                  className="text-sm text-dacar-green font-medium"
                >
                  Manage menu
                </Link>
                <button
                  onClick={() => toggleOpen(r.id, r.is_open)}
                  className={`text-xs font-mono px-3 py-1 rounded-full ${
                    r.is_open
                      ? "bg-dacar-green-tint text-dacar-green"
                      : "bg-dacar-bg text-dacar-ink/50 border border-dacar-line"
                  }`}
                >
                  {r.is_open ? "OPEN" : "CLOSED"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
