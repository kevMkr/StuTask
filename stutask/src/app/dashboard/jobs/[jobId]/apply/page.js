"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore"
import { db } from "../../../../../../config"
import { useAuth } from "../../../../../hooks/useAuth"

export default function ApplyPage() {
  const router = useRouter()
  const { jobId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [job, setJob] = useState(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [links, setLinks] = useState(["", ""])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [meta, setMeta] = useState({ totalProposals: 0, hasHire: false })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return
      try {
        const snap = await getDoc(doc(db, "jobs", jobId))
        if (snap.exists()) {
          const data = snap.data()
          let totalProposals = 0
          let hasHire = false
          try {
            const appsSnap = await getDocs(query(collection(db, "applications"), where("jobId", "==", snap.id)))
            totalProposals = appsSnap.size
            hasHire = appsSnap.docs.some((d) => d.data()?.status === "Hired")
          } catch {
            // ignore meta load failures
          }
          setMeta({ totalProposals, hasHire })
          setJob({ id: snap.id, ...data })
        }
      } catch (err) {
        setError("Unable to load job.")
      }
    }
    loadJob()
  }, [jobId])

  function handleLinkChange(index, value) {
    setLinks((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    if (!job) {
      setError("Job not found.")
      return
    }
    try {
      const existing = await getDocs(
        query(
          collection(db, "applications"),
          where("jobId", "==", jobId),
          where("applicantId", "==", user.uid),
          limit(1)
        )
      )
      if (!existing.empty) {
        setError("You already applied to this job.")
        return
      }
    } catch {
      setError("Unable to verify existing applications. Please try again.")
      return
    }
    const atProposalLimit = job?.maxProposals && meta.totalProposals >= job.maxProposals
    const applicationsClosed = job?.status !== "open" || meta.hasHire || atProposalLimit
    if (applicationsClosed) {
      setError("Applications are closed for this job.")
      return
    }
    if (!coverLetter.trim()) return setError("Please add a cover letter.")
    const trimmedLinks = links.map((l) => l.trim()).filter(Boolean).slice(0, 2)

    setSubmitting(true)
    setError("")
    try {
      await addDoc(collection(db, "applications"), {
        jobId,
        jobTitle: job.title || "Untitled",
        jobRole: job.role || "",
        employerId: job?.createdBy?.uid || "",
        employerName: job?.createdBy?.fullName || job?.createdBy?.email || "",
        applicantId: user.uid,
        applicantName: user.displayName || user.email,
        applicantEmail: user.email,
        coverLetter: coverLetter.trim(),
        links: trimmedLinks,
        status: "Pending",
        createdAt: serverTimestamp(),
      })

      if (job?.maxProposals && meta.totalProposals + 1 >= job.maxProposals) {
        try {
          await updateDoc(doc(db, "jobs", jobId), { status: "closed" })
        } catch {
          // ignore closing failures
        }
      }

      router.replace("/dashboard/approvals")
    } catch (err) {
      setError("Unable to submit application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Preparing form...
      </main>
    )
  }

  const atProposalLimit = job?.maxProposals && meta.totalProposals >= job.maxProposals
  const applicationsClosed = job?.status !== "open" || meta.hasHire || atProposalLimit

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <div className="flex flex-col items-start gap-2">
          <Link href={`/dashboard/jobs/${jobId}`} className="text-sm text-gray-600 hover:underline">← Back to job</Link>
          <h1 className="text-2xl font-semibold">Apply to {job?.title || "this job"}</h1>
          {job?.createdBy?.fullName && <p className="text-sm text-gray-600">Posted by {job.createdBy.fullName}</p>}
        </div>

        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
          {applicationsClosed && (
            <div className="text-sm text-red-600">
              Applications are closed {meta.hasHire ? "(hire confirmed)" : atProposalLimit ? "(proposal limit reached)" : ""}.
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Cover letter / Pitch</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-32"
              placeholder="Share why you're a good fit..."
              required
              disabled={applicationsClosed}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-700">Portfolio links (max 2)</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Link to portfolio / resume"
              value={links[0]}
              onChange={(e) => handleLinkChange(0, e.target.value)}
              disabled={applicationsClosed}
            />
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Optional second link"
              value={links[1]}
              onChange={(e) => handleLinkChange(1, e.target.value)}
              disabled={applicationsClosed}
            />
            <div className="text-xs text-gray-500">Share Drive/Notion/GitHub/Portfolio links.</div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || applicationsClosed}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit application"}
            </button>
            <Link href={`/dashboard/jobs/${jobId}`} className="text-sm text-gray-600 hover:underline">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
