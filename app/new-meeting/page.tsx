"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createMeeting } from "@/lib/api"

export default function NewMeeting() {
  const [meetingName, setMeetingName] = useState("")
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingName || !userName) return

    setIsLoading(true)
    try {
      const { meetingId } = await createMeeting(meetingName)
      router.push(`/meeting/${meetingId}?name=${encodeURIComponent(userName)}`)
    } catch (error) {
      console.error("Failed to create meeting:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Create New Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Meeting Name</label>
                <Input
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  placeholder="Product design meeting"
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
                {isLoading ? "Creating..." : "Create Meeting"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
