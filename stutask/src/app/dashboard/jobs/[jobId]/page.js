"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc } from "firebase/firestore"
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
        setJob({
          id: snap.id,
          title: data?.title || "Untitled",
          role: data?.role || "",
          startDate: formatDate(data?.startDate),
          endDate: formatDate(data?.endDate),
          payout: data?.payout || { amount: 0, currency: "USD" },
          description: data?.description || "",
          categories: data?.categories || [],
          createdBy: data?.createdBy || {},
        })
      } catch (err) {
        setError("Unable to load job.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user, jobId, router])

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
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/jobs" className="text-sm text-gray-600 hover:underline">← Back to jobs</Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">Dashboard</Link>
        </div>

        <section className="bg-white border rounded-3xl p-8 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">Posted by</div>
              <div className="text-xl font-semibold">{job.createdBy?.fullName || job.createdBy?.email || "Unknown"}</div>
              <div className="text-sm text-gray-500 mt-1">{job.categories.join(", ")}</div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>{job.startDate} → {job.endDate}</div>
              <div className="mt-1 font-semibold">{formatCurrency(job.payout)}</div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-gray-600 mt-1">{job.role}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>

          <div className="pt-4">
            <button className="bg-blue-600 text-white px-5 py-3 rounded-2xl">Apply</button>
          </div>
        </section>
      </div>
    </main>
  )
}
