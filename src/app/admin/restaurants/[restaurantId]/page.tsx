"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackLink from "@/components/BackLink";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_available: boolean;
};

export default function AdminRestaurantMenuPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState("");
  const [checking, setChecking] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id)
        .order("name");
      setItems(data ?? []);
    },
    [supabase]
  );

  useEffect(() => {
    async function init() {
      const { restaurantId: id } = await params;
      setRestaurantId(id);

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

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", id)
        .single();
      setRestaurantName(restaurant?.name ?? "Restaurant");

      await loadItems(id);
      setChecking(false);
    }
    init();
  }, [params, supabase, router, loadItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("menu_items").insert({
      restaurant_id: restaurantId,
      name,
      price: Number(price),
      description,
      is_available: true,
    });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    setName("");
    setPrice("");
    setDescription("");
    await loadItems(restaurantId);
    setSaving(false);
  }

  async function toggleAvailable(id: string, isAvailable: boolean) {
    await supabase.from("menu_items").update({ is_available: !isAvailable }).eq("id", id);
    await loadItems(restaurantId);
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
        <BackLink href="/admin/restaurants" label="Restaurants" />
        <h1 className="font-display text-3xl font-semibold mb-8">{restaurantName} — Menu</h1>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 mb-8 max-w-2xl">
          <input
            type="text"
            placeholder="Item name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-dacar-line rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[160px]"
          />
          <input
            type="number"
            placeholder="Price (KES)"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-dacar-line rounded-lg px-4 py-2.5 text-sm w-32"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-dacar-line rounded-lg px-4 py-2.5 text-sm flex-1 min-w-[160px]"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-dacar-green text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add item"}
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-dacar-line rounded-xl p-5 bg-dacar-surface flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-sm text-dacar-ink/60">
                  KES {item.price} {item.description ? `— ${item.description}` : ""}
                </p>
              </div>
              <button
                onClick={() => toggleAvailable(item.id, item.is_available)}
                className={`text-xs font-mono px-3 py-1 rounded-full ${
                  item.is_available
                    ? "bg-dacar-green-tint text-dacar-green"
                    : "bg-dacar-bg text-dacar-ink/50 border border-dacar-line"
                }`}
              >
                {item.is_available ? "AVAILABLE" : "HIDDEN"}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
