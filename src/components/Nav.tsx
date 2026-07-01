import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-6">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight">
        dacar
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-dacar-ink/70 hover:text-dacar-ink transition"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="text-sm font-medium bg-dacar-green text-white px-4 py-2 rounded-full hover:bg-dacar-green-deep transition"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
