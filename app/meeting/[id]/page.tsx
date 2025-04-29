"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { type Socket, io } from "socket.io-client"
import Peer from "simple-peer"
import { MeetingRoom } from "@/components/meeting-room"
import { getMeetingDetails } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function MeetingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const meetingId = params.id as string
  const userName = searchParams.get("name") || "Anonymous"

  const [meeting, setMeeting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const [myStream, setMyStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  const peersRef = useRef<any[]>([])
  const screenShareRef = useRef<MediaStream | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const myVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const data = await getMeetingDetails(meetingId)
        setMeeting(data)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch meeting details:", err)
        setError("Meeting not found or has ended")
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [meetingId])

  useEffect(() => {
    if (loading || error) return

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
    setSocket(newSocket)
    socketRef.current = newSocket

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream)
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream
        }

        newSocket.emit("join-room", { roomId: meetingId, userName })

        newSocket.on("user-joined", (users) => {
          const peers: any[] = []
          users.forEach((user: any) => {
            if (user.id !== newSocket.id) {
              if (user.id) {
                const peer = createPeer(user.id ?? "unknown", newSocket.id || "unknown", stream)
                peersRef.current.push({ peerId: user.id, peer, userName: user.userName })
                peers.push({ peerId: user.id, peer, userName: user.userName })
              }
            }
          })
          setPeers(peers)
          setParticipants(users)
        })

        newSocket.on("user-joined-signal", (payload) => {
          const peer = addPeer(payload.signal, payload.callerId, stream)
          peersRef.current.push({ peerId: payload.callerId, peer, userName: payload.userName })
          setPeers((users) => [...users, { peerId: payload.callerId, peer, userName: payload.userName }])
          setParticipants((p) => [...p, { id: payload.callerId, userName: payload.userName }])
        })

        newSocket.on("receiving-returned-signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerId === payload.id)
          if (item) {
            item.peer.signal(payload.signal)
          }
        })

        newSocket.on("user-disconnected", (userId) => {
          const peerObj = peersRef.current.find((p) => p.peerId === userId)
          if (peerObj) peerObj.peer.destroy()
          peersRef.current = peersRef.current.filter((p) => p.peerId !== userId)
          setPeers((prev) => prev.filter((p) => p.peerId !== userId))
          setParticipants((p) => p.filter((user) => user.id !== userId))
        })

        newSocket.on("receive-message", (message) => {
          setMessages((prev) => [...prev, message])
          if (!showChat) {
            toast({
              title: `New message from ${message.sender}`,
              description: message.text.length > 30 ? `${message.text.substring(0, 30)}...` : message.text,
            })
          }
        })

        newSocket.on("meeting-ended", () => {
          toast({
            title: "Meeting ended",
            description: "The host has ended the meeting",
          })
          router.push("/")
        })
      })
      .catch((err) => {
        console.error("Failed to get user media:", err)
        setError("Failed to access camera and microphone")
      })

    return () => {
      if (myStream) myStream.getTracks().forEach((track) => track.stop())
      if (screenShareRef.current) screenShareRef.current.getTracks().forEach((track) => track.stop())
      if (socketRef.current) socketRef.current.disconnect()
      peersRef.current.forEach((peer) => peer.peer.destroy())
    }
  }, [loading, error, meetingId, userName, router, toast])

  const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream })
    peer.on("signal", (signal) => {
      socketRef.current?.emit("sending-signal", { userToSignal, callerId, signal, userName })
    })
    return peer
  }

  const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream })
    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning-signal", { signal, callerId })
    })
    peer.signal(incomingSignal)
    return peer
  }

  const toggleAudio = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled))
      setIsMuted(!isMuted)
      socketRef.current?.emit("user-toggle-audio", { roomId: meetingId, isMuted: !isMuted })
    }
  }

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled))
      setIsVideoOff(!isVideoOff)
      socketRef.current?.emit("user-toggle-video", { roomId: meetingId, isVideoOff: !isVideoOff })
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenShareRef.current) screenShareRef.current.getTracks().forEach((track) => track.stop())
      if (myStream) {
        const videoTrack = myStream.getVideoTracks()[0]
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(peer.streams[0].getVideoTracks()[0], videoTrack, peer.streams[0])
        })
        if (myVideoRef.current) myVideoRef.current.srcObject = myStream
      }
      setIsScreenSharing(false)
      socketRef.current?.emit("user-toggle-screen", { roomId: meetingId, isScreenSharing: false })
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenShareRef.current = stream
        const screenTrack = stream.getVideoTracks()[0]
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(peer.streams[0].getVideoTracks()[0], screenTrack, peer.streams[0])
        })
        if (myVideoRef.current) myVideoRef.current.srcObject = stream
        screenTrack.onended = () => toggleScreenShare()
        setIsScreenSharing(true)
        socketRef.current?.emit("user-toggle-screen", { roomId: meetingId, isScreenSharing: true })
      } catch (err) {
        console.error("Error sharing screen:", err)
      }
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      // Add actual recording stop logic
      setIsRecording(false)
      toast({ title: "Recording stopped", description: "Your recording has been saved" })
    } else {
      // Add actual recording start logic
      setIsRecording(true)
      toast({ title: "Recording started", description: "Your meeting is now being recorded" })
    }
  }

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const message = {
      sender: userName,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      id: Date.now(),
    }
    socketRef.current?.emit("send-message", { roomId: meetingId, message })
    setMessages((prev) => [...prev, message])
  }

  const leaveMeeting = () => router.push("/")

  const endMeeting = () => {
    socketRef.current?.emit("end-meeting", { roomId: meetingId })
    router.push("/")
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    myVideoRef.current !== null ? (
      <MeetingRoom
        myVideoRef={myVideoRef as React.RefObject<HTMLVideoElement>}
        peers={peers}
        messages={messages}
        participants={participants}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        showChat={showChat}
        showParticipants={showParticipants}
        toggleAudioAction={toggleAudio}
        toggleVideo={toggleVideo}
        toggleScreenShare={toggleScreenShare}
        toggleRecording={toggleRecording}
        sendMessage={sendMessage}
        leaveMeeting={leaveMeeting}
        endMeeting={endMeeting}
        setShowChat={setShowChat}
        setShowParticipants={setShowParticipants}
        meetingId={meetingId}
        meetingName={meeting?.name || "Untitled Meeting"}
        myStream={myStream}
        userName={userName}
      />
    ) : (
      <div>Loading video...</div>
    )
  )
}
