"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { checkMeetingExists } from "@/lib/api"

export default function JoinMeeting() {
  const searchParams = useSearchParams()
  const [meetingId, setMeetingId] = useState(searchParams.get("id") || "")
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingId || !userName) return

    setIsLoading(true)
    setError("")

    try {
      const exists = await checkMeetingExists(meetingId)
      if (exists) {
        router.push(`/meeting/${meetingId}?name=${encodeURIComponent(userName)}`)
      } else {
        setError("Meeting not found. Please check the meeting ID.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Failed to join meeting:", error)
      setError("Failed to join meeting. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Join Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleJoinMeeting} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Meeting ID</label>
                <Input
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Enter meeting ID"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Your Name</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Joining..." : "Join Meeting"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
