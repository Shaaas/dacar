import Link from "next/link";

export default function BackLink({ href = "/", label = "Home" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-dacar-ink/60 hover:text-dacar-ink transition mb-6"
    >
      ← {label}
    </Link>
  );
}
