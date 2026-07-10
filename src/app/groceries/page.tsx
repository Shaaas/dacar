import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackLink from "@/components/BackLink";
import GroceryItemCard from "@/components/GroceryItemCard";

export default async function GroceriesPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("grocery_items")
    .select("*")
    .eq("in_stock", true)
    .order("name");

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12">
        <BackLink />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dacar-green mb-2">
          Market Runs
        </p>
        <h1 className="font-display text-3xl font-semibold mb-8">Groceries</h1>

        {!items || items.length === 0 ? (
          <div className="border border-dacar-line rounded-2xl p-10 text-center text-dacar-ink/60">
            <p>No items listed yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <GroceryItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
