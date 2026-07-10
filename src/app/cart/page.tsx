"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12 max-w-2xl mx-auto w-full">
        <h1 className="font-display text-3xl font-semibold mb-8">Your cart</h1>

        {items.length === 0 ? (
          <div className="border border-dacar-line rounded-2xl p-10 text-center text-dacar-ink/60">
            <p className="mb-4">Your cart is empty.</p>
            <Link href="/" className="text-dacar-green font-medium">
              Browse services
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-8">
              {items.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between border border-dacar-line rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-dacar-ink/50 uppercase font-mono">
                      {item.itemType === "menu_item" ? "Food" : "Grocery"}
                    </p>
                    <p className="text-sm text-dacar-ink/60">KES {item.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(item.itemId, item.qty - 1)}
                      className="w-7 h-7 border border-dacar-line rounded-full text-sm hover:bg-dacar-bg"
                    >
                      −
                    </button>
                    <span className="text-sm w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.itemId, item.qty + 1)}
                      className="w-7 h-7 border border-dacar-line rounded-full text-sm hover:bg-dacar-bg"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.itemId)}
                      className="text-xs text-red-600 hover:underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6 text-sm">
              <span className="text-dacar-ink/60">Subtotal</span>
              <span className="font-medium">KES {subtotal}</span>
            </div>

            <Link
              href="/checkout"
              className="block text-center bg-dacar-green text-white rounded-lg py-3 text-sm font-medium hover:bg-dacar-green-deep transition"
            >
              Proceed to checkout
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
