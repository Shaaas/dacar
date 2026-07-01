"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { submitMpesaCode } from "./actions"

interface OrderStatus {
  id: string
  status: string
  total: number
  delivery_fee: number
}

interface ParcelDetails {
  pickup_address: string
  dropoff_address: string
  recipient_name: string
  recipient_phone: string
}

export default function OrderTrackingPage() {
  const { id } = useParams()
  const supabase = createClient()
  
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [parcel, setParcel] = useState<ParcelDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrderInitialData() {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, status, total, delivery_fee")
        .eq("id", id)
        .single()

      const { data: parcelData } = await supabase
        .from("parcel_requests")
        .select("pickup_address, dropoff_address, recipient_name, recipient_phone")
        .eq("order_id", id)
        .single()

      if (orderData) setOrder(orderData)
      if (parcelData) setParcel(parcelData)
      setLoading(false)
    }

    fetchOrderInitialData()

    const orderSubscription = supabase
      .channel(`order-tracking-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", filter: `id=eq.${id}`, schema: "public", table: "orders" },
        (payload) => {
          setOrder(payload.new as OrderStatus)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderSubscription)
    }
  }, [id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-400">
        <div className="animate-pulse tracking-wider text-xs font-mono">LOADING DACAR ENGINE...</div>
      </div>
    )
  }

  const statusSteps = ["searching", "assigned", "picked_up", "delivered"]
  const currentStepIndex = statusSteps.indexOf(order?.status || "searching")

  return (
    <div className="max-w-md mx-auto min-h-screen text-zinc-100 p-6 flex flex-col justify-between">
      <div>
        {/* Top Header Section */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div>
            <span className="text-emerald-500 font-mono text-xs tracking-widest uppercase font-bold">Dacar Delivery</span>
            <h1 className="text-xl font-black text-white mt-0.5">Live Tracking</h1>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Fare</span>
            <span className="text-lg font-mono font-bold text-emerald-400">KES {order?.total}</span>
          </div>
        </div>

        {/* Dynamic Route Info */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold">From</span>
              <p className="text-sm font-medium text-zinc-200">{parcel?.pickup_address}</p>
            </div>
          </div>
          <div className="h-4 w-px bg-zinc-800 ml-1" />
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-white mt-1.5 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold">To</span>
              <p className="text-sm font-medium text-zinc-200">{parcel?.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Uber-Style Stepper Feed */}
        <div className="space-y-6 px-2">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex
            const isCurrent = idx === currentStepIndex

            return (
              <div key={step} className="flex items-start gap-4 relative">
                {idx < statusSteps.length - 1 && (
                  <div className={`absolute left-2.5 top-6 w-0.5 h-10 ${idx < currentStepIndex ? "bg-emerald-500" : "bg-zinc-900"}`} />
                )}
                
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-mono font-bold shrink-0 transition-colors duration-300 ${
                  isCurrent ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                  isCompleted ? "bg-transparent text-emerald-500 border-emerald-500" : "bg-transparent text-zinc-700 border-zinc-900"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>

                <div className="pt-0.5">
                  <p className={`text-sm font-semibold capitalize tracking-tight transition-colors duration-300 ${isCurrent ? "text-white" : isCompleted ? "text-zinc-400" : "text-zinc-700"}`}>
                    {step.replace("_", " ")}
                  </p>
                  {isCurrent && step === "searching" && <p className="text-xs text-zinc-500 animate-pulse">Matching your parcel with the nearest available bike in Garissa...</p>}
                  {isCurrent && step === "assigned" && <p className="text-xs text-emerald-500 font-medium">Bike assigned! Look out for the STK prompt on your phone.</p>}
                  {isCurrent && step === "picked_up" && <p className="text-xs text-zinc-500">Rider has secured the package and is en route to destination.</p>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Upfront Manual M-Pesa Payment Box */}
        {order?.status === "assigned" && (
          <div className="mt-8 p-5 bg-zinc-950 border border-emerald-900/40 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Required: Upfront M-Pesa Payment</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Please pay <span className="text-white font-bold font-mono">KES {order?.total}</span> to the Till Number below, then paste the M-Pesa transaction code to confirm your booking.
            </p>

            <div className="bg-zinc-900 p-3 rounded-lg flex items-center justify-between border border-zinc-800">
              <div>
                <span className="block text-[9px] uppercase text-zinc-500 font-bold">Buy Goods Till Number</span>
                <span className="text-lg font-mono font-black text-emerald-400 tracking-wider">555666</span>
              </div>
              <button 
                type="button"
                onClick={() => navigator.clipboard.writeText("555666")}
                className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 font-semibold active:scale-95 transition-all"
              >
                Copy Till
              </button>
            </div>

            {/* Form execution wrapped inline to swallow object response and return void */}
            <form 
              action={async (formData) => {
                await submitMpesaCode(id as string, formData);
              }} 
              className="flex gap-2"
            >
              <input 
                type="text" 
                name="mpesa_code" 
                placeholder="e.g. SGB76X92JK" 
                required
                maxLength={10}
                className="flex-1 p-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-100 uppercase font-mono tracking-widest placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-emerald-600"
              />
              <button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2.5 text-sm rounded-lg transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Recipient Footer Meta */}
      <div className="mt-12 bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
        <div>
          <span className="block text-[9px] uppercase tracking-widest font-bold text-zinc-600">Recipient contact</span>
          <p className="text-sm font-bold text-zinc-300">{parcel?.recipient_name}</p>
          <p className="text-xs font-mono text-zinc-500">{parcel?.recipient_phone}</p>
        </div>
        <a 
          href={`tel:${parcel?.recipient_phone}`}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all text-emerald-400"
        >
          📞 Call
        </a>
      </div>
    </div>
  )
}