"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from 'next/image'
import { useRouter } from "next/navigation"
import { collection, getDocs, query, updateDoc, where, doc } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import { formatCurrency, formatDate } from "../../../utils/jobs"
import logo from '../../../../Logo.png'

export default function PositionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState("")

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
        // Using only a where filter to avoid composite index requirement; ordering is done client-side.
        const q = query(collection(db, "jobs"), where("createdBy.uid", "==", user.uid))
        const snap = await getDocs(q)
        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data()
            let totalProposals = 0
            let hasHire = false
            try {
              const appsSnap = await getDocs(query(collection(db, "applications"), where("jobId", "==", d.id)))
              totalProposals = appsSnap.size
              hasHire = appsSnap.docs.some((app) => app.data()?.status === "Hired")
            } catch {
              // ignore counting errors
            }
            const maxProposals = data?.maxProposals || null
            const shouldClose = data?.status !== "closed" && (hasHire || (maxProposals && totalProposals >= maxProposals))
            if (shouldClose) {
              try {
                await updateDoc(doc(db, "jobs", d.id), { status: "closed" })
              } catch {
                // ignore write failure, still mark locally
              }
            }
            return {
              id: d.id,
              title: data?.title || "Untitled",
              role: data?.role || "",
              payout: data?.payout || { amount: 0, currency: "USD" },
              categories: data?.categories || [],
              status: shouldClose ? "closed" : data?.status || "open",
              maxProposals,
              createdAt: formatDate(data?.createdAt),
              totalProposals,
              hasHire,
            }
          })
        )
        const sorted = items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
        setJobs(sorted)
      } catch (err) {
        setError("Unable to load your jobs. If this persists, create a Firestore index on createdBy.uid + createdAt.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [authLoading, user, router])

  async function updateStatus(jobId, status) {
    if (!user) return
    const job = jobs.find((j) => j.id === jobId)
    if (status === "open" && job) {
      const atLimit = job.maxProposals && job.totalProposals >= job.maxProposals
      if (job.hasHire || atLimit) {
        setError("Cannot reopen: hire confirmed or proposal limit reached.")
        return
      }
    }
    setUpdatingId(jobId)
    try {
      await updateDoc(doc(db, "jobs", jobId), { status })
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)))
    } catch (err) {
      setError("Unable to update job status.")
    } finally {
      setUpdatingId("")
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading your positions...
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-6">
          <div className="flex items-center justify-between border rounded-full py-3 px-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image src={logo} alt="StuTask" width={120} height={36} />
              </Link>
            </div>
          </div>
        </header>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Your <span className="text-green-600">Job</span> Posts</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/new-job" className="text-sm text-blue-600 hover:underline">+ New job</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">Back</Link>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {jobs.length === 0 ? (
          <div className="border rounded-2xl p-6 text-gray-600">
            You have no job posts yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Posted {job.createdAt || "—"}</div>
                  <div className="font-semibold text-lg">{job.title}</div>
                  <div className="text-sm text-gray-500">{job.role}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.categories.map((cat) => (
                      <span key={cat} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">{formatCurrency(job.payout)}</span> · Estimated budget
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full border ${job.status === "open" ? "border-green-500 text-green-600" : "border-gray-400 text-gray-600"}`}>
                      {job.status === "open" ? "Open" : "Closed"}
                    </span>
                    {job.maxProposals ? <span>Max proposals: {job.maxProposals}</span> : null}
                    <span>Proposals: {job.totalProposals || 0}</span>
                    {job.hasHire ? <span className="text-green-700">Hire confirmed</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/positions/${job.id}`} className="text-sm text-blue-600 hover:underline">Edit</Link>
                  {job.status === "open" ? (
                    <button
                      onClick={() => updateStatus(job.id, "closed")}
                      disabled={updatingId === job.id}
                      className="text-sm text-gray-700 border rounded-full px-3 py-1 disabled:opacity-60"
                    >
                      {updatingId === job.id ? "Closing..." : "Close"}
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(job.id, "open")}
                      disabled={updatingId === job.id || job.hasHire || (job.maxProposals && job.totalProposals >= job.maxProposals)}
                      className="text-sm text-gray-700 border rounded-full px-3 py-1 disabled:opacity-60"
                    >
                      {updatingId === job.id ? "Opening..." : "Reopen"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </main>
  )
}
