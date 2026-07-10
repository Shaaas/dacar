"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { User } from "@supabase/supabase-js";

type Address = {
  id: string;
  label: string | null;
  address_text: string;
  is_default: boolean;
};

const DELIVERY_FEE = 100;

export default function CheckoutPage() {
  const supabase = createClient();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/auth/login");
        return;
      }
      setUser(userData.user);

      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("profile_id", userData.user.id)
        .order("is_default", { ascending: false });

      if (addressData) {
        setAddresses(addressData);
        if (addressData.length > 0) setSelectedAddressId(addressData[0].id);
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handlePlaceOrder() {
    if (!user || !selectedAddressId || items.length === 0) return;
    setPlacing(true);
    setError(null);

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    const types = new Set(items.map((i) => i.itemType));
    const hasFood = types.has("menu_item");
    const orderType = types.size > 1 ? "mixed" : hasFood ? "food" : "grocery";

    // Grocery-only orders skip kitchen prep and go straight to the rider queue.
    // Food/mixed orders wait for the restaurant to confirm and prepare first.
    const initialStatus = hasFood ? "pending" : "ready_for_pickup";

    const total = subtotal + DELIVERY_FEE;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        profile_id: user.id,
        type: orderType,
        status: initialStatus,
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        address_id: selectedAddressId,
        delivery_address_text: selectedAddress?.address_text ?? "",
      })
      .select()
      .single();

    if (orderError || !order) {
      setError(orderError?.message ?? "Could not create order.");
      setPlacing(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_id: item.itemId,
      item_type: item.itemType,
      qty: item.qty,
      price: item.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      setError(itemsError.message);
      setPlacing(false);
      return;
    }

    clearCart();
    router.push(`/orders/${order.id}`);
  }

  if (loading) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 px-6 md:px-12 py-12 max-w-2xl mx-auto w-full">
          <p className="text-dacar-ink/60">Your cart is empty.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12 max-w-2xl mx-auto w-full">
        <h1 className="font-display text-3xl font-semibold mb-8">Checkout</h1>

        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-3">Delivery address</h2>
          {addresses.length === 0 ? (
            <div className="border border-dacar-line rounded-lg p-4 text-sm text-dacar-ink/60">
              No saved addresses.{" "}
              <Link href="/profile" className="text-dacar-green font-medium">
                Add one in your profile
              </Link>
              .
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? "border-dacar-green bg-dacar-green-tint"
                      : "border-dacar-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{addr.label}</p>
                    <p className="text-sm text-dacar-ink/60">{addr.address_text}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-3">Order summary</h2>
          <div className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <div key={item.itemId} className="flex justify-between">
                <span>
                  {item.name} × {item.qty}
                </span>
                <span>KES {item.price * item.qty}</span>
              </div>
            ))}
            <div className="border-t border-dacar-line pt-2 flex justify-between text-dacar-ink/60">
              <span>Delivery fee</span>
              <span>KES {DELIVERY_FEE}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>KES {subtotal + DELIVERY_FEE}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={handlePlaceOrder}
          disabled={placing || addresses.length === 0}
          className="w-full bg-dacar-green text-white rounded-lg py-3 text-sm font-medium hover:bg-dacar-green-deep transition disabled:opacity-60"
        >
          {placing ? "Placing order..." : "Place order"}
        </button>
        <p className="text-xs text-dacar-ink/40 mt-3 text-center">
          Payment on delivery for now — M-Pesa STK Push coming soon.
        </p>
      </main>
      <Footer />
    </div>
  );
}
