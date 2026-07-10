import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackLink from "@/components/BackLink";
import MenuItemCard from "@/components/MenuItemCard";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .single();

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_available", true)
    .order("name");

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 md:px-12 py-12">
        <BackLink href="/food" label="Restaurants" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dacar-green mb-2">
          Restaurant
        </p>
        <h1 className="font-display text-3xl font-semibold mb-8">
          {restaurant?.name ?? "Restaurant"}
        </h1>

        {!menuItems || menuItems.length === 0 ? (
          <div className="border border-dacar-line rounded-2xl p-10 text-center text-dacar-ink/60">
            <p>No menu items listed yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
