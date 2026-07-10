"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

type Order = {
  id: string;
  type: string;
  status: string;
  total: number;
  delivery_address_text: string | null;
  rider_id: string | null;
  created_at: string;
};

const NEXT_STATUS: Record<string, string> = {
  confirmed: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Accepted — head to pickup",
  picked_up: "Picked up — en route",
  in_transit: "In transit — mark delivered on arrival",
  delivered: "Delivered",
};

export default function RiderDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [notRider, setNotRider] = useState(false);

  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadOrders = useCallback(
    async (currentRiderId: string) => {
      const { data: active } = await supabase
        .from("orders")
        .select("*")
        .eq("rider_id", currentRiderId)
        .not("status", "in", "(delivered,cancelled)")
        .maybeSingle();

      setActiveOrder(active ?? null);

      if (!active) {
        const { data: pending } = await supabase
          .from("orders")
          .select("*")
          .eq("status", "pending")
          .is("rider_id", null)
          .order("created_at", { ascending: true });

        setPendingOrders(pending ?? []);
      } else {
        setPendingOrders([]);
      }
    },
    [supabase]
  );

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/login");
        return;
      }
      setUser(userData.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "rider") {
        setNotRider(true);
        setChecking(false);
        return;
      }

      const { data: rider } = await supabase
        .from("riders")
        .select("id")
        .eq("profile_id", userData.user.id)
        .single();

      if (!rider) {
        setNotRider(true);
        setChecking(false);
        return;
      }

      setRiderId(rider.id);
      await loadOrders(rider.id);
      setChecking(false);
    }
    init();
  }, [supabase, router, loadOrders]);

  useEffect(() => {
    if (!riderId) return;

    const channel = supabase
      .channel("rider-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadOrders(riderId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, riderId, loadOrders]);

  async function handleAccept(orderId: string) {
    if (!riderId) return;
    setBusy(true);
    setError(null);

    const { data, error: acceptError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        rider_id: riderId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending")
      .select();

    if (acceptError) {
      setError(acceptError.message);
    } else if (!data || data.length === 0) {
      setError("Another rider already accepted this order.");
    }

    await loadOrders(riderId);
    setBusy(false);
  }

  async function handleAdvanceStatus() {
    if (!riderId || !activeOrder) return;
    const next = NEXT_STATUS[activeOrder.status];
    if (!next) return;

    setBusy(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", activeOrder.id)
      .eq("rider_id", riderId);

    if (updateError) setError(updateError.message);

    await loadOrders(riderId);
    setBusy(false);
  }

  if (checking) return null;

  if (notRider) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 px-6 md:px-12 py-12 max-w-md mx-auto w-full text-center">
          <p className="text-dacar-ink/60">
            This account isn&apos;t set up as a rider yet. Contact the Dacar team to get onboarded.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12 max-w-2xl mx-auto w-full">
        <h1 className="font-display text-3xl font-semibold mb-8">Rider dashboard</h1>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {activeOrder ? (
          <div className="border border-dacar-green rounded-2xl p-6 bg-dacar-green-tint">
            <p className="font-mono text-xs uppercase tracking-wider text-dacar-green mb-2">
              Active delivery
            </p>
            <h2 className="font-display text-xl font-semibold mb-1">
              Order #{activeOrder.id.slice(0, 8)} — {activeOrder.type}
            </h2>
            <p className="text-sm text-dacar-ink/70 mb-1">
              {activeOrder.delivery_address_text ?? "No address on file"}
            </p>
            <p className="text-sm text-dacar-ink/70 mb-4">KES {activeOrder.total}</p>
            <p className="text-sm font-medium mb-4">
              {STATUS_LABEL[activeOrder.status] ?? activeOrder.status}
            </p>
            {NEXT_STATUS[activeOrder.status] && (
              <button
                onClick={handleAdvanceStatus}
                disabled={busy}
                className="bg-dacar-green text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
              >
                {busy
                  ? "Updating..."
                  : `Mark as ${NEXT_STATUS[activeOrder.status].replace("_", " ")}`}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-dacar-ink/60 mb-4">
              {pendingOrders.length === 0
                ? "No orders waiting right now."
                : "Available orders — first to accept gets it."}
            </p>
            <div className="flex flex-col gap-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-dacar-line rounded-xl p-5 bg-dacar-surface flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order #{order.id.slice(0, 8)} — {order.type}
                    </p>
                    <p className="text-sm text-dacar-ink/60">
                      {order.delivery_address_text ?? "No address"}
                    </p>
                    <p className="text-sm text-dacar-ink/60">KES {order.total}</p>
                  </div>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={busy}
                    className="bg-dacar-green text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
