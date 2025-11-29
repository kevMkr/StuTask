"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from 'next/link'
import { signOut, updateProfile } from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth } from '../../../config'
import { db } from '../../../config'
import { useAuth } from '../../hooks/useAuth'
import { useUserProfile } from '../../hooks/useUserProfile'
import logo from '../../../Logo.png'

export default function ProfilePage(){
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile(user?.uid)
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: "",
    location: "",
    about: "",
    contactEmail: "",
    contactLink: "",
    profileImage: "",
    school: "",
    major: "",
    pastProjects: "",
    proposalCount: "",
    studentRating: "",
    studentTestimonials: "",
    organizationName: "",
    jobsPosted: "",
    jobsCompleted: "",
    employerRating: "",
    employerTestimonials: "",
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  const fullName = useMemo(() => user?.displayName || user?.email?.split?.("@")?.[0] || "User", [user])
  const name = useMemo(() => fullName.split(" ")[0] || fullName, [fullName])
  const joinedDate = useMemo(() => user?.metadata?.creationTime || "—", [user])

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      fullName: profile?.fullName || fullName,
      location: profile?.location || "",
      about: profile?.about || "",
      contactEmail: profile?.contactEmail || user.email || "",
      contactLink: profile?.contactLink || "",
      profileImage: profile?.profileImage || "",
      school: profile?.school || "",
      major: profile?.major || "",
      pastProjects: profile?.pastProjects || "",
      proposalCount: profile?.proposalCount || "",
      studentRating: profile?.studentRating || "",
      studentTestimonials: profile?.studentTestimonials || "",
      organizationName: profile?.organizationName || "",
      jobsPosted: profile?.jobsPosted || "",
      jobsCompleted: profile?.jobsCompleted || "",
      employerRating: profile?.employerRating || "",
      employerTestimonials: profile?.employerTestimonials || "",
    }))
  }, [user, profile, fullName])

  if (loading || profileLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading profile...
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Redirecting...
      </main>
    )
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...(prev || {}), [field]: value }))
  }

  async function handleSave() {
    if (!user || !form) return
    setSaving(true)
    setSaveError("")
    setSaveMessage("")
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: form.fullName,
          location: form.location,
          about: form.about,
          contactEmail: form.contactEmail,
          contactLink: form.contactLink,
          profileImage: form.profileImage,
          school: form.school,
          major: form.major,
          pastProjects: form.pastProjects,
          proposalCount: form.proposalCount,
          studentRating: form.studentRating,
          studentTestimonials: form.studentTestimonials,
          organizationName: form.organizationName,
          jobsPosted: form.jobsPosted,
          jobsCompleted: form.jobsCompleted,
          employerRating: form.employerRating,
          employerTestimonials: form.employerTestimonials,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      if (form.fullName && form.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: form.fullName })
      }
      setSaveMessage("Profile saved.")
    } catch (err) {
      setSaveError("Unable to save profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }
  async function handleSignOut() {
    try {
      await signOut(auth)
      router.replace("/login")
    } catch (err) {
      // swallow error; dashboard already exposes sign-out feedback
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="w-full py-4 border-b">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={logo} alt="StuTask" width={120} height={36} />
            </Link>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <button onClick={handleSignOut} className="hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold">
              {form.fullName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{form.fullName || name}</h1>
              <div className="text-sm text-gray-600">{form.contactEmail || user.email}</div>
              <Link href="/dashboard" className="inline-block text-sm text-gray-600 hover:underline mt-2">← Back</Link>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
            {saveError && <span className="text-sm text-red-600">{saveError}</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <section className="bg-white border rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Location</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="City, Country"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Joined</label>
              <input className="w-full border rounded-lg px-3 py-2" value={joinedDate} disabled />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Profile image</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold">
                  {form.fullName?.[0]?.toUpperCase() || "U"}
                </div>
                <button className="px-3 py-2 rounded-lg border text-sm text-gray-700" disabled>Upload (soon)</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">About</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 h-20"
                placeholder="Tell people about yourself"
                value={form.about}
                onChange={(e) => handleChange("about", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Contacts & links</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Email"
                  value={form.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Website / LinkedIn / GitHub"
                  value={form.contactLink}
                  onChange={(e) => handleChange("contactLink", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Student Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">School</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Your university"
                  value={form.school}
                  onChange={(e) => handleChange("school", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Major</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. Computer Science"
                  value={form.major}
                  onChange={(e) => handleChange("major", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Past projects</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Not tracked yet"
                  value={form.pastProjects}
                  onChange={(e) => handleChange("pastProjects", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Proposal count</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Coming soon"
                  value={form.proposalCount}
                  onChange={(e) => handleChange("proposalCount", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Student rating</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Not rated yet"
                  value={form.studentRating}
                  onChange={(e) => handleChange("studentRating", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Testimonies</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-20"
                  placeholder="Testimonials from clients or mentors"
                  value={form.studentTestimonials}
                  onChange={(e) => handleChange("studentTestimonials", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Employer Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Organization name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder='e.g. "Personal" or company name'
                  value={form.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total jobs posted</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Not tracked yet"
                  value={form.jobsPosted}
                  onChange={(e) => handleChange("jobsPosted", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Jobs completed</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Not tracked yet"
                  value={form.jobsCompleted}
                  onChange={(e) => handleChange("jobsCompleted", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Employer rating</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Not rated yet"
                  value={form.employerRating}
                  onChange={(e) => handleChange("employerRating", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Testimonies</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-20"
                  placeholder="Testimonials from hired students"
                  value={form.employerTestimonials}
                  onChange={(e) => handleChange("employerTestimonials", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Personalization</h2>
                <p className="text-sm text-gray-600">We use your skills to recommend better jobs.</p>
              </div>
              <Link href="/profile/personalization" className="text-sm text-blue-600 hover:underline">Edit</Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {(profile?.skills || []).length > 0 ? (
                profile.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-600">No skills added yet. Click edit to personalize your recommendations.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
