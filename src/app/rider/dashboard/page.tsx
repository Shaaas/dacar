"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface ActiveJob {
  id: string
  status: string
  total: number
  mpesa_code: string | null
  parcel_requests: {
    pickup_address: string
    dropoff_address: string
    recipient_name: string
    recipient_phone: string
    notes: string | null
  }[]
}

export default function RiderDashboardPage() {
  const supabase = createClient()
  const [riderId, setRiderId] = useState<string | null>(null)
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null)
  const [online, setOnline] = useState(false)

  // 1. Handle Rider Auth State & Location Streaming
  useEffect(() => {
    async function setupRider() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get rider primary ID corresponding to their user account profile mapping
      const { data: rProfile } = await supabase
        .from("riders")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (rProfile) setRiderId(rProfile.id)
    }
    setupRider()
  }, [supabase])

  // Geolocation Loop
  useEffect(() => {
    if (!online || !riderId || !("geolocation" in navigator)) return

    async function pushLocation(position: GeolocationPosition) {
      await supabase
        .from("riders")
        .update({
          current_lat: position.coords.latitude,
          current_lng: position.coords.longitude,
          status: activeJob ? "busy" : "available"
        })
        .eq("id", riderId)
    }

    const watchId = navigator.geolocation.watchPosition(
      pushLocation,
      (err) => console.error("GPS track blocked:", err.message),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [online, riderId, activeJob, supabase])

  // 2. Listen Realtime for Incoming Order Assignments
  useEffect(() => {
    if (!riderId) return

    async function checkForAssignedJobs() {
      const { data } = await supabase
        .from("orders")
        .select(`
          id, status, total, mpesa_code,
          parcel_requests(pickup_address, dropoff_address, recipient_name, recipient_phone, notes)
        `)
        .eq("status", "assigned")
      
      if (data && data.length > 0) {
        setActiveJob(data[0] as unknown as ActiveJob)
      }
    }
    
    checkForAssignedJobs()

    const channel = supabase
      .channel(`rider-jobs-${riderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => checkForAssignedJobs()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [riderId, supabase])

  async function updateTripStatus(nextStatus: "picked_up" | "delivered") {
    if (!activeJob) return
    
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", activeJob.id)

    if (!error) {
      if (nextStatus === "delivered") {
        await supabase.from("riders").update({ status: "available" }).eq("id", riderId)
        setActiveJob(null)
      } else {
        setActiveJob(prev => prev ? { ...prev, status: nextStatus } : null)
      }
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 p-6 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* System Toggle Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-black text-white">Rider Portal</h1>
            <p className="text-xs text-zinc-500 font-mono">ID: {riderId?.slice(0, 8)}...</p>
          </div>
          <button
            onClick={() => setOnline(!online)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase border transition-all ${
              online 
                ? "bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                : "bg-zinc-950 border-zinc-800 text-zinc-500"
            }`}
          >
            {online ? "● Online" : "○ Offline"}
          </button>
        </div>

        {/* Dynamic Display Matrix */}
        {!online ? (
          <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-900 rounded-2xl">
            <span className="block text-2xl mb-2">💤</span>
            <p className="text-xs font-medium uppercase tracking-wider">Flip switch online to receive jobs</p>
          </div>
        ) : !activeJob ? (
          <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-2xl">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-mono tracking-wide text-zinc-400">Waiting for automatic parcel dispatch...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Verification Badge */}
            <div className="p-4 bg-zinc-950 border border-emerald-900/30 rounded-xl">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-1">M-Pesa Verification Code</span>
              {activeJob.mpesa_code ? (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-black text-emerald-400 tracking-widest uppercase">{activeJob.mpesa_code}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-bold uppercase">Paid</span>
                </div>
              ) : (
                <span className="text-sm font-mono font-bold text-amber-500 animate-pulse">Awaiting Customer Entry...</span>
              )}
            </div>

            {/* Address Matrix Card */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400">Pickup Location</span>
                <p className="text-sm font-semibold text-white">{activeJob.parcel_requests[0]?.pickup_address}</p>
              </div>
              <div className="h-px bg-zinc-900" />
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400">Dropoff Location</span>
                <p className="text-sm font-semibold text-white">{activeJob.parcel_requests[0]?.dropoff_address}</p>
              </div>
            </div>

            {/* Recipient Card */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[9px] uppercase font-bold text-zinc-500">Recipient contact</span>
                <p className="text-sm font-bold text-zinc-200">{activeJob.parcel_requests[0]?.recipient_name}</p>
              </div>
              <a href={`tel:${activeJob.parcel_requests[0]?.recipient_phone}`} className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-2 rounded-lg text-emerald-400 font-bold">
                📞 Call
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button Bar */}
      {activeJob && online && (
        <div className="mt-8">
          {activeJob.status === "assigned" ? (
            <button
              onClick={() => updateTripStatus("picked_up")}
              disabled={!activeJob.mpesa_code}
              className="w-full p-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800 disabled:cursor-not-allowed text-black font-black text-sm rounded-xl transition-all uppercase tracking-wide"
            >
              {activeJob.mpesa_code ? "Confirm Pickup & Start Trip" : "Verify Payment to Start"}
            </button>
          ) : activeJob.status === "picked_up" ? (
            <button
              onClick={() => updateTripStatus("delivered")}
              className="w-full p-4 bg-white hover:bg-zinc-200 text-black font-black text-sm rounded-xl transition-all uppercase tracking-wide"
            >
              Complete Delivery
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}