import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateMeetingId } from "@/lib/utils"

/**
 * Create a new meeting
 */
export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Meeting name is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Generate a unique meeting ID
    const meetingId = generateMeetingId()

    // Create the meeting in the database
    await db.collection("meetings").insertOne({
      _id: meetingId,
      name,
      createdAt: new Date(),
      active: true,
    })

    return NextResponse.json({ meetingId, name })
  } catch (error) {
    console.error("Error creating meeting:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
  }
}

/**
 * Get all active meetings
 */
export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const meetings = await db.collection("meetings").find({ active: true }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
  }
}
