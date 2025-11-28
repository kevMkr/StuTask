"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import { useUserProfile } from "../../../hooks/useUserProfile"
import { SkillPicker } from "../../../components/SkillPicker"

export default function PersonalizationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile(user?.uid)
  const [skills, setSkills] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (profile?.skills) {
      setSkills(profile.skills)
    } else if (!profileLoading) {
      setSkills([])
    }
  }, [profile, profileLoading])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  function toggleSkill(skill) {
    setSkills((prev) => {
      const exists = prev.includes(skill)
      return exists ? prev.filter((s) => s !== skill) : [...prev, skill]
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage("")
    setError("")
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          skills,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      setMessage("Preferences saved.")
    } catch (err) {
      setError("Unable to save your skills. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading personalization...
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Personalization</p>
            <h1 className="text-2xl font-semibold">Skills that describe you</h1>
          </div>
          <Link href="/profile" className="text-sm text-gray-600 hover:underline">Back</Link>
        </div>

        <form onSubmit={handleSave} className="bg-white border rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-gray-700 text-sm">Pick the skills you&apos;re comfortable with. We&apos;ll recommend jobs that match at least half of them.</p>
            <p className="text-gray-500 text-xs">You can edit this anytime from your profile.</p>
          </div>

          <SkillPicker selected={skills} onToggle={toggleSkill} />

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-3 rounded-full disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="text-sm text-gray-600 hover:underline"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
