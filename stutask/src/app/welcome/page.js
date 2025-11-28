"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { updateProfile } from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db } from "../../../config"
import { useAuth } from "../../hooks/useAuth"
import logo from "../../../Logo.png"

export default function WelcomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
    if (!loading && user?.displayName) {
      router.replace("/dashboard")
    }
  }, [loading, user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!fullName.trim()) {
      setError("Please enter your full name.")
      return
    }

    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: fullName.trim() })
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: fullName.trim(),
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
        skills: [],
      })
      router.replace("/welcome/skills")
    } catch (err) {
      setError("Could not save your name. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Preparing your account...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Image src={logo} alt="StuTask" width={120} height={36} />
        </div>

        <div className="bg-white border rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-black">Welcome! What should we call you?</h1>
          <p className="text-gray-600 mt-2">Add your real name so we can personalize your dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <label className="block">
              <span className="text-sm text-gray-700">Full name</span>
              <input
                className="w-full border rounded-full h-12 px-4 mt-2 placeholder-gray-400 text-black"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aisha Rahman"
                required
              />
            </label>

            {error && <p className="text-sm text-red-600" aria-live="polite">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 text-white rounded-full px-6 py-3 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save and continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
