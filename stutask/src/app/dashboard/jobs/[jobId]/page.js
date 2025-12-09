"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "../../../../../config"
import { useAuth } from "../../../../hooks/useAuth"
import { formatCurrency, formatDate } from "../../../../utils/jobs"

export default function JobDetailPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [meta, setMeta] = useState({ totalProposals: 0, hasHire: false })

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
        const ref = doc(db, "jobs", jobId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          setError("Job not found.")
          setJob(null)
          return
        }
        const data = snap.data()
        let totalProposals = 0
        let hasHire = false
        try {
          const appsSnap = await getDocs(query(collection(db, "applications"), where("jobId", "==", snap.id)))
          totalProposals = appsSnap.size
          hasHire = appsSnap.docs.some((d) => d.data()?.status === "Hired")
        } catch {
          // ignore meta load errors
        }
        setMeta({ totalProposals, hasHire })
        setJob({
          id: snap.id,
          title: data?.title || "Untitled",
          role: data?.role || "",
          payout: data?.payout || { amount: 0, currency: "USD" },
          description: data?.description || "",
          categories: data?.categories || [],
          createdBy: data?.createdBy || {},
          status: data?.status || "open",
          maxProposals: data?.maxProposals || null,
          postedDate: formatDate(data?.createdAt),
        })
      } catch (err) {
        setError("Unable to load job.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user, jobId, router])

  const atProposalLimit = job?.maxProposals && meta.totalProposals >= job.maxProposals
  const applicationsClosed = !job || job.status !== "open" || meta.hasHire || atProposalLimit

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        Loading job...
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-600">
        {error || "Job not found."}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <div className="flex flex-col items-start gap-3">
          <Link href="/dashboard/jobs" className="text-sm text-gray-600 hover:underline" aria-label="Back to jobs">
            ← Back
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-gray-900">{job.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>Posted {job.postedDate || "recently"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-400 inline-block" aria-hidden />
              <span>{job.createdBy?.fullName || job.createdBy?.email || "Unknown"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-400 inline-block" aria-hidden />
              <span className={`px-3 py-1 rounded-full border text-xs ${applicationsClosed ? "border-gray-400 text-gray-600" : "border-green-500 text-green-600"}`}>
                {applicationsClosed ? "Closed" : "Open"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.categories.map((cat) => (
                <span key={cat} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="bg-white border rounded-3xl p-8 shadow-sm space-y-8">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {job.description}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-2xl p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-gray-500">💰</div>
              <div>
                <div className="font-semibold text-gray-900">{formatCurrency(job.payout)}</div>
                <div className="text-xs text-gray-600">Estimated budget</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 text-gray-500">🧩</div>
              <div>
                <div className="font-semibold text-gray-900">Role</div>
                <div className="text-sm text-gray-600">{job.role || "Not specified"}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 text-gray-500">📬</div>
              <div>
                <div className="font-semibold text-gray-900">Max proposals</div>
                <div className="text-sm text-gray-600">{job.maxProposals ? job.maxProposals : "Not set"}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Skills and expertise</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.categories.length > 0 ? (
                job.categories.map((cat) => (
                  <span key={cat} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-600">No skills listed.</span>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Posted by <span className="font-semibold text-gray-800">{job.createdBy?.fullName || job.createdBy?.email || "Unknown"}</span>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {applicationsClosed && (
                <div className="text-xs text-red-600">
                  Applications are closed {meta.hasHire ? "(hire confirmed)" : atProposalLimit ? "(proposal limit reached)" : ""}.
                </div>
              )}
              <Link
                href={applicationsClosed ? "#" : `/dashboard/jobs/${job.id}/apply`}
                aria-disabled={applicationsClosed}
                className={`px-5 py-3 rounded-2xl inline-flex items-center justify-center ${applicationsClosed ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-600 text-white"}`}
              >
                Apply
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
