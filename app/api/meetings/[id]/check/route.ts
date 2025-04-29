import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

interface Params {
  params: {
    id: string
  }
}

/**
 * Check if a meeting exists and is active
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params

    const { db } = await connectToDatabase()

    const meeting = await db.collection("meetings").findOne({ _id: id, active: true })

    return NextResponse.json({ exists: !!meeting })
  } catch (error) {
    console.error("Error checking meeting:", error)
    return NextResponse.json({ error: "Failed to check meeting" }, { status: 500 })
  }
}
