"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";

type Order = {
  id: string;
  type: string;
  status: string;
  total: number;
  delivery_address_text: string | null;
  rider_id: string | null;
  created_at: string;
};

type RiderRow = {
  id: string;
  status: string;
  profiles: { full_name: string | null } | null;
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(orderData ?? []);

    const { data: riderData } = await supabase
      .from("riders")
      .select("id, status, profiles(full_name)");
    setRiders((riderData as unknown as RiderRow[]) ?? []);
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

  async function handleStatusChange(orderId: string, status: string) {
    setBusyId(orderId);
    setError(null);
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (updateError) setError(updateError.message);
    await loadData();
    setBusyId(null);
  }

  async function handleRiderChange(orderId: string, riderId: string) {
    setBusyId(orderId);
    setError(null);
    const { error: updateError } = await supabase
      .from("orders")
      .update({ rider_id: riderId || null })
      .eq("id", orderId);
    if (updateError) setError(updateError.message);
    await loadData();
    setBusyId(null);
  }

  function riderName(id: string) {
    const r = riders.find((r) => r.id === id);
    return r?.profiles?.full_name ?? "Unnamed rider";
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
        <div className="flex items-center gap-6 mb-8">
          <h1 className="font-display text-3xl font-semibold">Admin — Orders</h1>
          <Link href="/admin/restaurants" className="text-sm text-dacar-green font-medium">
            Manage restaurants
          </Link>
          <Link href="/admin/groceries" className="text-sm text-dacar-green font-medium">
            Manage groceries
          </Link>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {orders.length === 0 ? (
          <p className="text-dacar-ink/60">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-dacar-line rounded-xl p-5 bg-dacar-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    Order #{order.id.slice(0, 8)} — {order.type}
                  </p>
                  <p className="text-sm text-dacar-ink/60">
                    {order.delivery_address_text ?? "No address"}
                  </p>
                  <p className="text-sm text-dacar-ink/60">KES {order.total}</p>
                  {order.rider_id && (
                    <p className="text-xs text-dacar-green font-mono mt-1">
                      Rider: {riderName(order.rider_id)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    disabled={busyId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="border border-dacar-line rounded-lg px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={order.rider_id ?? ""}
                    disabled={busyId === order.id}
                    onChange={(e) => handleRiderChange(order.id, e.target.value)}
                    className="border border-dacar-line rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.profiles?.full_name ?? "Unnamed rider"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
