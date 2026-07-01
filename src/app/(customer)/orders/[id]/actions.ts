"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitMpesaCode(orderId: string, formData: FormData) {
  const code = formData.get("mpesa_code") as string
  if (!code) return { success: false, error: "Code is required" }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from("orders")
    .update({ 
      mpesa_code: code.toUpperCase().trim()
    })
    .eq("id", orderId)

  if (error) {
    console.error("Failed to update M-Pesa code:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}