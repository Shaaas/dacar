"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"

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
      // Fetch base order details
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, status, total, delivery_fee")
        .eq("id", id)
        .single()

      // Fetch corresponding parcel metadata
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

    // Subscribe to real-time updates for this specific order row
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
      <div className="flex items-center justify-center min-h-screen bg-black text-zinc-400">
        <div className="animate-pulse tracking-wider text-xs font-mono">LOADING DACAR ENGINE...</div>
      </div>
    )
  }

  const statusSteps = ["searching", "assigned", "picked_up", "delivered"]
  const currentStepIndex = statusSteps.indexOf(order?.status || "searching")

  return (
    <div className="max-w-md mx-auto min-h-screen bg-black text-zinc-100 p-6 flex flex-col justify-between">
      {/* Top Header Section */}
      <div>
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
                  isCompleted ? "bg-black text-emerald-500 border-emerald-500" : "bg-black text-zinc-700 border-zinc-900"
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