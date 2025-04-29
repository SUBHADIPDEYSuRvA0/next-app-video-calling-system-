import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

interface Params {
  params: {
    id: string
  }
}

/**
 * Get meeting details
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params

    const { db } = await connectToDatabase()

    const meeting = await db.collection("meetings").findOne({ _id: id, active: true })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found or has ended" }, { status: 404 })
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Error fetching meeting:", error)
    return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 })
  }
}

/**
 * End a meeting
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params

    const { db } = await connectToDatabase()

    const result = await db
      .collection("meetings")
      .updateOne({ _id: id }, { $set: { active: false, endedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending meeting:", error)
    return NextResponse.json({ error: "Failed to end meeting" }, { status: 500 })
  }
}
