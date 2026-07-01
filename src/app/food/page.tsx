import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default async function FoodPage() {
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*")
    .order("name");

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dacar-green mb-2">
          Restaurants
        </p>
        <h1 className="font-display text-3xl font-semibold mb-8">Food</h1>

        {!restaurants || restaurants.length === 0 ? (
          <div className="border border-dacar-line rounded-2xl p-10 text-center text-dacar-ink/60">
            <p>No restaurants listed yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/food/${r.id}`}
                className="border border-dacar-line rounded-xl p-5 bg-dacar-surface hover:-translate-y-1 hover:shadow-md transition block"
              >
                <h2 className="font-display font-semibold mb-1">{r.name}</h2>
                <p className="text-sm text-dacar-ink/60">
                  {r.is_open ? "Open now" : "Closed"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
