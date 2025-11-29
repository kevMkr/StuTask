"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../../../../config"
import { useAuth } from "../../../../../hooks/useAuth"

export default function ApplicantProfilePage() {
  const { appId } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [app, setApp] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    async function load() {
      setLoading(true)
      setError("")
      try {
        const appSnap = await getDoc(doc(db, "applications", appId))
        if (!appSnap.exists()) {
          setError("Application not found.")
          return
        }
        const appData = { id: appSnap.id, ...appSnap.data() }
        if (appData.employerId !== user.uid || appData.status !== "Short-listed") {
          setError("You can only view short-listed applicants.")
          return
        }
        setApp(appData)
        const profSnap = await getDoc(doc(db, "users", appData.applicantId))
        setProfile(profSnap.exists() ? profSnap.data() : null)
      } catch (err) {
        setError("Unable to load profile.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user, appId, router])

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading...
      </main>
    )
  }

  if (error || !app || !profile) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        {error || "Profile not found."}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-4">
        <Link href="/dashboard/applicants" className="text-sm text-gray-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-semibold">{profile.fullName || app.applicantName}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-2xl p-4">
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-sm text-gray-800">{profile.contactEmail || profile.email || app.applicantEmail}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Location</div>
            <div className="text-sm text-gray-800">{profile.location || "—"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-gray-500">About</div>
            <div className="text-sm text-gray-800">{profile.about || "No description yet."}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">School / Major</div>
            <div className="text-sm text-gray-800">{profile.school || "—"} {profile.major ? `• ${profile.major}` : ""}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Organization</div>
            <div className="text-sm text-gray-800">{profile.organizationName || "—"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-gray-500">Links</div>
            <div className="flex flex-wrap gap-2">
              {profile.contactLink ? (
                <a href={profile.contactLink} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                  {profile.contactLink}
                </a>
              ) : (
                <span className="text-sm text-gray-600">No links provided.</span>
              )}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/chat/${app.id}`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Message applicant
        </Link>
      </div>
    </main>
  )
}
