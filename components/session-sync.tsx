"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export function SessionSync() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    // Force session update when component mounts
    if (status === "loading") {
      return
    }

    // If we don't have a session but we're on a protected route, update it
    if (!session) {
      update()
    }
  }, [session, status, update])

  return null // This component doesn't render anything
}
