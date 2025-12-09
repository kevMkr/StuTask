"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../config"

export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(uid))
  const [error, setError] = useState("")

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      setError("")
      setLoading(false)
      return undefined
    }

    setLoading(true)

    const ref = doc(db, "users", uid)
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() : null)
        setLoading(false)
        setError("")
      },
      () => {
        setError("Unable to load profile")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  return { profile, loading, error }
}
