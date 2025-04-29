"use client"

import { useRef, useEffect } from "react"

interface VideoPlayerProps {
  stream: MediaStream | null
  muted?: boolean
  className?: string
  isVideoOff?: boolean
  userName: string
}

export function VideoPlayer({ stream, muted = false, className = "", isVideoOff = false, userName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className={`relative rounded-lg overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
      />
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-2xl text-white">{userName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
