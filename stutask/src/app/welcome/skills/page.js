"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import { useUserProfile } from "../../../hooks/useUserProfile"
import { SkillPicker } from "../../../components/SkillPicker"

export default function WelcomeSkillsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile(user?.uid)
  const [skills, setSkills] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (profile?.skills) {
      setSkills(profile.skills)
    } else if (!profileLoading) {
      setSkills([])
    }
  }, [profile, profileLoading])

  function toggleSkill(skill) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
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
      router.replace("/dashboard")
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
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-blue-600 font-semibold">Step 2 of 2</p>
            <h1 className="text-3xl font-bold text-black">Tell us your skills</h1>
            <p className="text-gray-600">We will personalize recommended jobs so at least half match what you pick here.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <SkillPicker selected={skills} onToggle={toggleSkill} />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-full disabled:opacity-70"
              >
                {saving ? "Saving..." : "Finish setup"}
              </button>
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="text-sm text-gray-600 hover:underline"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
