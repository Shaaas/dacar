"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type Order = {
  id: string;
  status: string;
  total: number;
  delivery_address_text: string | null;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  item_id: string;
  qty: number;
};

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready_for_pickup",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "New order — accept to start preparing",
  preparing: "Preparing — mark ready when packed",
  ready_for_pickup: "Ready — waiting for a rider",
};

export default function RestaurantDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [noAccess, setNoAccess] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItemRow[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const restaurantIdRef = useState<{ id: string | null }>({ id: null })[0];

  const loadOrders = useCallback(
    async (restaurantId: string) => {
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id, name")
        .eq("restaurant_id", restaurantId);

      const names: Record<string, string> = {};
      (menuItems ?? []).forEach((m) => (names[m.id] = m.name));
      setItemNames(names);

      const menuItemIds = (menuItems ?? []).map((m) => m.id);
      if (menuItemIds.length === 0) {
        setOrders([]);
        return;
      }

      const { data: relevantItems } = await supabase
        .from("order_items")
        .select("order_id, item_id, qty")
        .in("item_id", menuItemIds);

      const orderIds = [...new Set((relevantItems ?? []).map((i) => i.order_id))];
      if (orderIds.length === 0) {
        setOrders([]);
        return;
      }

      const map: Record<string, OrderItemRow[]> = {};
      (relevantItems ?? []).forEach((i) => {
        if (!map[i.order_id]) map[i.order_id] = [];
        map[i.order_id].push(i);
      });
      setOrderItemsMap(map);

      const { data: orderData } = await supabase
        .from("orders")
        .select("id, status, total, delivery_address_text, created_at")
        .in("id", orderIds)
        .in("status", ["pending", "preparing", "ready_for_pickup"])
        .order("created_at", { ascending: true });

      setOrders(orderData ?? []);
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, restaurant_id")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "restaurant" || !profile.restaurant_id) {
        setNoAccess(true);
        setChecking(false);
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", profile.restaurant_id)
        .single();

      setRestaurantName(restaurant?.name ?? "Your restaurant");
      restaurantIdRef.id = profile.restaurant_id;

      await loadOrders(profile.restaurant_id);
      setChecking(false);
    }
    init();
  }, [supabase, router, loadOrders, restaurantIdRef]);

  useEffect(() => {
    if (!restaurantIdRef.id) return;
    const id = restaurantIdRef.id;

    const channel = supabase
      .channel("restaurant-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadOrders(id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, restaurantIdRef, loadOrders]);

  async function handleAdvance(orderId: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus];
    if (!next || !restaurantIdRef.id) return;

    setBusyId(orderId);
    setError(null);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", orderId);

    if (updateError) setError(updateError.message);

    await loadOrders(restaurantIdRef.id);
    setBusyId(null);
  }

  if (checking) return null;

  if (noAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 px-6 md:px-12 py-12 max-w-md mx-auto w-full text-center">
          <p className="text-dacar-ink/60">
            This account isn&apos;t linked to a restaurant. Contact the Dacar team to get set up.
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
        <h1 className="font-display text-3xl font-semibold mb-1">{restaurantName}</h1>
        <p className="text-sm text-dacar-ink/60 mb-8">Kitchen orders</p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {orders.length === 0 ? (
          <p className="text-dacar-ink/60">No active orders right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-dacar-line rounded-xl p-5 bg-dacar-surface"
              >
                <p className="text-sm font-medium mb-1">Order #{order.id.slice(0, 8)}</p>
                <div className="text-sm text-dacar-ink/70 mb-2">
                  {(orderItemsMap[order.id] ?? []).map((i) => (
                    <div key={i.item_id}>
                      {itemNames[i.item_id] ?? "Item"} × {i.qty}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium mb-3">
                  {STATUS_LABEL[order.status] ?? order.status}
                </p>
                {NEXT_STATUS[order.status] && (
                  <button
                    onClick={() => handleAdvance(order.id, order.status)}
                    disabled={busyId === order.id}
                    className="bg-dacar-green text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
                  >
                    {busyId === order.id
                      ? "Updating..."
                      : order.status === "pending"
                      ? "Accept & start preparing"
                      : "Mark ready for pickup"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
