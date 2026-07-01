import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const services = [
  {
    href: "/groceries",
    label: "Groceries",
    tag: "MARKET RUNS",
    description:
      "Fresh produce, household staples, and market goods brought to your door.",
    icon: GroceryIcon,
  },
  {
    href: "/food",
    label: "Food",
    tag: "RESTAURANTS",
    description: "Order from restaurants and kitchens across Garissa town.",
    icon: FoodIcon,
  },
  {
    href: "/parcels",
    label: "Parcels",
    tag: "POINT TO POINT",
    description:
      "Send a package across town — picked up and dropped off same day.",
    icon: ParcelIcon,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 md:px-12">
        <section className="max-w-3xl mx-auto text-center pt-16 pb-20 md:pt-24 md:pb-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-dacar-green mb-4">
            Garissa Town
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
            Order it. We&apos;ll route it.
          </h1>
          <p className="text-dacar-ink/70 text-base md:text-lg max-w-xl mx-auto">
            Groceries, food, and parcels — moving across Garissa, door to
            door.
          </p>
        </section>

        <section className="max-w-5xl mx-auto pb-24">
          <svg
            viewBox="0 0 900 40"
            className="hidden md:block w-full h-10 mb-2"
            aria-hidden="true"
          >
            <line
              x1="150"
              y1="20"
              x2="750"
              y2="20"
              stroke="var(--color-dacar-line)"
              strokeWidth="2"
            />
            <line
              x1="150"
              y1="20"
              x2="750"
              y2="20"
              stroke="var(--color-dacar-green)"
              strokeWidth="2"
              strokeDasharray="6 8"
              className="route-line"
            />
            {[150, 450, 750].map((x) => (
              <circle key={x} cx={x} cy="20" r="5" fill="var(--color-dacar-green)" />
            ))}
          </svg>

          <div className="grid md:grid-cols-3 gap-5">
            {services.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="group bg-dacar-surface border border-dacar-line rounded-2xl p-8 flex flex-col items-start hover:-translate-y-1 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-dacar-green-tint flex items-center justify-center mb-6 text-dacar-green">
                  <service.icon />
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-dacar-green mb-2">
                  {service.tag}
                </p>
                <h2 className="font-display text-2xl font-semibold mb-2">
                  {service.label}
                </h2>
                <p className="text-sm text-dacar-ink/70">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function GroceryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ParcelIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8l9-4 9 4-9 4-9-4Z" strokeLinejoin="round" />
      <path d="M3 8v9l9 4 9-4V8" strokeLinejoin="round" />
      <path d="M12 12v9" />
    </svg>
  );
}
