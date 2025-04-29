"use client"

import { useState, useEffect } from "react"

export function useMediaDevices() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user")
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [mediaError, setMediaError] = useState<string | null>(null)

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setDevices(devices)
      } catch (error) {
        console.error("Error enumerating devices:", error)
      }
    }

    getDevices()
    navigator.mediaDevices.addEventListener("devicechange", getDevices)

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices)
    }
  }, [])

  // Initialize media stream
  useEffect(() => {
    const initStream = async () => {
      try {
        // Try to get both audio and video
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: cameraFacing },
        })

        setStream(mediaStream)
        setIsAudioEnabled(true)
        setIsVideoEnabled(true)
        setMediaError(null)
      } catch (error) {
        console.error("Error accessing media devices:", error)

        try {
          // Try audio only
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })

          setStream(audioOnlyStream)
          setIsAudioEnabled(true)
          setIsVideoEnabled(false)
          setMediaError("Camera not available. Using audio only.")
        } catch (audioError) {
          console.error("Error accessing audio:", audioError)

          try {
            // Create fallback silent audio stream
            const ctx = new AudioContext()
            const oscillator = ctx.createOscillator()
            const dst = ctx.createMediaStreamDestination()

            oscillator.connect(dst)
            oscillator.start()

            const emptyAudioTrack = dst.stream.getAudioTracks()[0]
            emptyAudioTrack.enabled = false // Mute it

            const emptyStream = new MediaStream([emptyAudioTrack])
            setStream(emptyStream)
            setIsAudioEnabled(false)
            setIsVideoEnabled(false)
            setMediaError("No media devices available. You can still join the meeting, but others won't see or hear you.")
          } catch (fallbackError) {
            console.error("Error creating fallback stream:", fallbackError)
            setMediaError("Unable to access any media devices. Please check your permissions and try again.")
          }
        }
      }
    }

    initStream()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraFacing])

  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        const enabled = !isAudioEnabled
        audioTracks.forEach((track) => (track.enabled = enabled))
        setIsAudioEnabled(enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length > 0) {
        const enabled = !isVideoEnabled
        videoTracks.forEach((track) => (track.enabled = enabled))
        setIsVideoEnabled(enabled)
      }
    }
  }

  const rotateCamera = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))
  }

  return {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    rotateCamera,
    devices,
    mediaError,
  }
}
