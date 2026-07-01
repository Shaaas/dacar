import Link from "next/link"

export default function CustomerLandingPage() {
  return (
    <div className="min-h-screen text-white flex flex-col justify-between p-6">
      <header className="flex items-center justify-between py-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
          <span className="font-mono text-sm tracking-widest uppercase font-black text-white">DACAR</span>
        </div>
        <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">Garissa Network</span>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-12 space-y-8">
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
            Moving anything <br />
            across <span className="text-emerald-500">Garissa.</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xs mx-auto sm:mx-0">
            Instant point-to-point courier delivery. Track your rider in real time from dispatch to drop-off.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/parcels" className="block w-full">
            <button className="w-full p-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] active:scale-[0.99]">
              Send a Parcel
            </button>
          </Link>

          <div className="grid grid-cols-2 gap-3 opacity-40 pointer-events-none">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
              <span className="block text-xl mb-1">🍔</span>
              <span className="text-xs font-bold text-zinc-400">Order Food</span>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
              <span className="block text-xl mb-1">🛒</span>
              <span className="text-xs font-bold text-zinc-400">Groceries</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 border-t border-zinc-900">
        <p className="text-[10px] font-mono text-zinc-600 tracking-wider">DACAR LOGISTICS ENGINE v1.0.0</p>
      </footer>
    </div>
  )
}