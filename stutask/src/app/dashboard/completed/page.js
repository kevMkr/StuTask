"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from 'next/image'
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import { formatCurrency, formatDate } from "../../../utils/jobs"
import logo from '../../../../Logo.png'

export default function CompletedPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    async function load() {
      setLoading(true)
      setError("")
      try {
        const q = query(
          collection(db, "applications"),
          where("applicantId", "==", user.uid)
        )
        const snap = await getDocs(q)
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.status === "Completed")
          .sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0))
        setItems(data)
      } catch (err) {
        setError("Unable to load completed projects.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user])

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading...
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Please sign in.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-6">
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
          <div className="flex flex-col items-start gap-2">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">← Back</Link>
          <h1 className="text-2xl font-semibold">Completed <span className="text-blue-600">Projects</span></h1>
          <p className="text-sm text-gray-600">Projects you finished and closed.</p>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading projects...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="border rounded-2xl p-6 text-gray-600">No completed projects yet.</div>
        )}

        <div className="space-y-3">
          {items.map((app) => (
            <div key={app.id} className="border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Project</div>
                <div className="font-semibold">{app.jobTitle || "Untitled project"}</div>
                <div className="text-sm text-gray-600">Employer: {app.employerName || "Unknown"}</div>
                <div className="text-xs text-gray-500">Completed on {formatDate(app.completedAt)}</div>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="font-semibold">Payout</div>
                <div className="text-sm text-gray-900">{app.payout ? formatCurrency(app.payout) : "Not recorded"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/chat/${app.id}`} className="text-sm text-blue-600 hover:underline">
                  View chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </main>
  )
}
