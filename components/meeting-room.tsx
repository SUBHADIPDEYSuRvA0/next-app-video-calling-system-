"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { formatTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMobile } from "@/hooks/use-mobile"

interface MeetingRoomProps {
  meetingId: string
  meetingName: string
  myStream: MediaStream | null
  myVideoRef: React.RefObject<HTMLVideoElement>
  peers: any[]
  messages: any[]
  participants: any[]
  userName: string
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isRecording: boolean
  showChat: boolean
  showParticipants: boolean
  toggleAudioAction: () => void
  toggleVideoAction: () => void
  toggleScreenShareAction: () => void
  toggleRecordingAction: () => void
  sendMessageAction: (text: string) => void
  leaveMeeting: () => void
  endMeeting: () => void
  setShowChat: (show: boolean) => void
  setShowParticipants: (show: boolean) => void
}

export function MeetingRoom({
  meetingId,
  meetingName,
  myStream,
  myVideoRef,
  peers,
  messages,
  participants,
  userName,
  isMuted,
  isVideoOff,
  isScreenSharing,
  isRecording,
  showChat,
  showParticipants,
  toggleAudioAction,
  toggleVideoAction,
  toggleScreenShareAction,
  toggleRecordingAction,
  sendMessageAction,
  leaveMeeting,
  endMeeting,
  setShowChat,
  setShowParticipants,
}: MeetingRoomProps) {
  const [messageText, setMessageText] = useState("")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Refs for peer videos
  const peerVideoRefs = useRef<{ [peerId: string]: React.RefObject<HTMLVideoElement> }>({})

  // Initialize peerVideoRefs with refs for all peers
  useEffect(() => {
    const refs: { [peerId: string]: React.RefObject<HTMLVideoElement> } = {}
    peers.forEach((peer) => {
      refs[peer.peerId] = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>
    })
    peerVideoRefs.current = refs
  }, [peers])

  // Timer for meeting duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const handleActivity = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (!showChat && !showParticipants && !showEmojis) {
          setShowControls(false)
        }
      }, 3000)
    }

    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("click", handleActivity)
    window.addEventListener("keydown", handleActivity)

    handleActivity()

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      clearTimeout(timeout)
    }
  }, [showChat, showParticipants, showEmojis])

  // Handle message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageText.trim()) {
      sendMessageAction(messageText)
      setMessageText("")
    }
  }

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji)
    setShowEmojis(false)
  }

  // Toggle sidebar visibility
  const toggleSidebar = (type: "chat" | "participants") => {
    if (type === "chat") {
      setShowChat(!showChat)
      if (!showChat) {
        setShowParticipants(false)
      }
    } else {
      setShowParticipants(!showParticipants)
      if (!showParticipants) {
        setShowChat(false)
      }
    }
  }

  // Select user to display in main video
  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId === selectedUser ? null : userId)
  }

  // Get video element for a peer
  const getPeerVideo = (peer: any) => {
    return peerVideoRefs.current[peer.peerId]
  }

  useEffect(() => {
    peers.forEach((peer) => {
      const videoRef = peerVideoRefs.current[peer.peerId]
      if (videoRef && videoRef.current) {
        peer.peer.on("stream", (stream: MediaStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
      }
    })
  }, [peers])

  // Determine which video to show in main display
  const getMainVideo = () => {
    if (selectedUser) {
      const selectedPeer = peers.find((p) => p.peerId === selectedUser)
      if (selectedPeer) {
        const videoRef = getPeerVideo(selectedPeer)
        return (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-md text-white text-sm">
              {selectedPeer.userName}
            </div>
          </div>
        )
      }
    }

    // Default to my video
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
        <video
          ref={myVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl text-white">{userName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-md text-white text-sm flex items-center">
          <span>{userName}</span>
          {isScreenSharing && <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded">Sharing</span>}
          {isRecording && (
            <span className="ml-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
              <span className="text-xs text-red-500">REC</span>
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-blue-500 p-1.5 rounded mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
              <rect x="1" y="6" width="15" height="12" rx="2" ry="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-medium">{meetingName}</h1>
            <div className="text-gray-400 text-xs">{formatTime(elapsedTime)}</div>
          </div>
        </div>
        <div className="text-white text-sm">
          Meeting ID: <span className="font-mono">{meetingId.slice(0, 8)}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 relative">
            {/* Main video */}
            <div className="w-full h-full">{getMainVideo()}</div>

            {/* Participant videos */}
            <div className="absolute right-0 top-0 bottom-0 w-1/5 py-4 space-y-2 overflow-y-auto">
              {peers.map((peer) => {
                const videoRef = getPeerVideo(peer)
                return (
                  <div
                    key={peer.peerId}
                    className={`relative rounded-lg overflow-hidden bg-black cursor-pointer transition-all ${selectedUser === peer.peerId ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => handleSelectUser(peer.peerId)}
                  >
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-white text-xs">
                      {peer.userName}
                    </div>
                  </div>
                )
              })}

              {/* My video thumbnail */}
              <div
                className={`relative rounded-lg overflow-hidden bg-black cursor-pointer ${selectedUser === null ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedUser(null)}
              >
                <video
                  ref={myVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-sm text-white">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-white text-xs flex items-center">
                  <span>You</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emoji reactions */}
          {showEmojis && (
            <div className="bg-gray-800 rounded-lg p-2 mt-2 flex justify-center">
              {["😀", "👍", "👎", "👏", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                <button
                  title="Leave Meeting"
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="mx-2 text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          {showControls && (
            <div className="mt-4 bg-gray-800 rounded-lg p-2 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={toggleAudioAction}
                  className={`p-3 rounded-full ${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                  title={isMuted ? "Unmute" : "Mute"}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  )}
                </button>

                <button
                  onClick={toggleVideoAction}
                  className={`p-3 rounded-full ${isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  {isVideoOff ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                  )}
                </button>

                <button
                  onClick={toggleScreenShareAction}
                  className={`p-3 rounded-full ${isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </button>

                <button
                  onClick={toggleRecordingAction}
                  className={`p-3 rounded-full ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  {isRecording ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                  title="Toggle Emojis"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => toggleSidebar("participants")}
                  className={`p-3 rounded-full ${showParticipants ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </button>

                <button
                  onClick={() => toggleSidebar("chat")}
                  className={`p-3 rounded-full ${showChat ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>

                <button onClick={leaveMeeting} className="p-3 rounded-full bg-red-600 hover:bg-red-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div
            className={`bg-white rounded-l-lg w-80 flex flex-col ${isMobile ? "absolute right-0 top-0 bottom-0 z-10" : ""}`}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Meeting Details</h2>
                <button
                  onClick={() => {
                    setShowChat(false)
                    setShowParticipants(false)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <Tabs defaultValue={showChat ? "chat" : "participants"} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 mx-4 mt-2">
                <TabsTrigger value="chat" onClick={() => setShowChat(true)}>
                  Chat
                </TabsTrigger>
                <TabsTrigger value="participants" onClick={() => setShowParticipants(true)}>
                  Participants{" "}
                  <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{participants.length}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col p-4">
                <ScrollArea className="flex-1">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-baseline">
                            <span className="font-medium">{message.sender}</span>
                            <span className="ml-2 text-xs text-gray-500">{message.time}</span>
                          </div>
                          <p className="text-gray-700">{message.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="mt-4 flex">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type message here..."
                    className="flex-1"
                  />
                  <Button type="submit" className="ml-2 bg-blue-600 hover:bg-blue-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="participants" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{participant.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {participant.userName}
                            {participant.id === "host" && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Host</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
