import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Correct way to define the dynamic route handler
export async function GET(
  request: Request,
  context: { params: { id: string } } // context contains `params`
) {
  try {
    const params = await context.params;
    const roomCode = params.id;
    const { db } = await connectToDatabase();

    const meeting = await db.collection("meetings").findOne({ roomCode });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      roomCode: meeting.roomCode,
      createdAt: meeting.createdAt,
      active: meeting.active,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    console.log(context);  // Debugging: Check what `context` contains
    const roomCode = context.params.id;
    const { db } = await connectToDatabase();
    const data = await request.json();

    // Update the meeting in the database
    const result = await db.collection("meetings").updateOne({ roomCode }, { $set: data });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }
}
