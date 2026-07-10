"use client";

import { useCart } from "@/context/CartContext";

type GroceryItem = {
  id: string;
  name: string;
  price: number;
  unit: string | null;
};

export default function GroceryItemCard({ item }: { item: GroceryItem }) {
  const { addItem } = useCart();

  return (
    <div className="border border-dacar-line rounded-xl p-5 bg-dacar-surface flex flex-col justify-between">
      <div>
        <h2 className="font-display font-semibold mb-1">{item.name}</h2>
        <p className="text-sm text-dacar-ink/60 mb-4">
          KES {item.price} {item.unit ? `/ ${item.unit}` : ""}
        </p>
      </div>
      <button
        onClick={() =>
          addItem({
            itemId: item.id,
            itemType: "grocery_item",
            name: item.name,
            price: item.price,
          })
        }
        className="self-start border border-dacar-green text-dacar-green rounded-full px-4 py-1.5 text-sm font-medium hover:bg-dacar-green-tint transition"
      >
        Add to cart
      </button>
    </div>
  );
}
