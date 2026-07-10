import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const groceryIds = (orderItems ?? [])
    .filter((i) => i.item_type === "grocery_item")
    .map((i) => i.item_id);
  const menuIds = (orderItems ?? [])
    .filter((i) => i.item_type === "menu_item")
    .map((i) => i.item_id);

  const { data: groceries } = groceryIds.length
    ? await supabase.from("grocery_items").select("id, name").in("id", groceryIds)
    : { data: [] };
  const { data: menuItems } = menuIds.length
    ? await supabase.from("menu_items").select("id, name").in("id", menuIds)
    : { data: [] };

  const nameMap = new Map<string, string>();
  (groceries ?? []).forEach((g) => nameMap.set(g.id, g.name));
  (menuItems ?? []).forEach((m) => nameMap.set(m.id, m.name));

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12 max-w-2xl mx-auto w-full">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dacar-green mb-2">
          Order confirmed
        </p>
        <h1 className="font-display text-3xl font-semibold mb-8">
          Order #{id.slice(0, 8)}
        </h1>

        {!order ? (
          <p className="text-dacar-ink/60">Order not found.</p>
        ) : (
          <>
            <p className="text-sm text-dacar-ink/60 mb-6">
              Status: <span className="font-medium text-dacar-ink">{order.status}</span>
            </p>

            <div className="flex flex-col gap-2 text-sm mb-6">
              {(orderItems ?? []).map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {nameMap.get(item.item_id) ?? "Item"} × {item.qty}
                  </span>
                  <span>KES {item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dacar-line pt-4 flex justify-between font-semibold">
              <span>Total</span>
              <span>KES {order.total}</span>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
