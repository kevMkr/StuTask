"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from 'next/image'
import { collection, getDocs, orderBy, query, where, updateDoc, doc } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import logo from '../../../../Logo.png'

const STATUS_COLORS = {
  Pending: "text-yellow-600 bg-yellow-50 border-yellow-100",
  "Short-listed": "text-green-600 bg-green-50 border-green-100",
  Rejected: "text-red-600 bg-red-50 border-red-100",
  Hired: "text-green-700 bg-green-50 border-green-200",
}

export default function ApprovalsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rejectedNotices, setRejectedNotices] = useState([])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    async function load() {
      setLoading(true)
      setError("")
      try {
        const q = query(
          collection(db, "applications"),
          where("applicantId", "==", user.uid),
          orderBy("createdAt", "desc")
        )
        const snap = await getDocs(q)
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const rejected = data.filter((d) => d.status === "Rejected")
        const active = data.filter((d) => d.status !== "Rejected" && d.status !== "Hired")
        setRejectedNotices(rejected.map((d) => ({ id: d.id, title: d.jobTitle || "this project" })))
        setItems(active)
      } catch (err) {
        setError("Unable to load applications.")
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
          <h1 className="text-2xl font-semibold">My <span className="text-blue-600">Applications</span></h1>
          <p className="text-sm text-gray-600">Hired projects now appear in <Link className="text-blue-600 underline" href="/dashboard/projects">Projects</Link>.</p>
        </div>

        {rejectedNotices.map((notice) => (
          <div key={notice.id} className="flex items-start justify-between gap-3 border rounded-2xl p-4 bg-red-50 text-red-700">
            <div>You have been rejected from “{notice.title}”.</div>
            <button
              onClick={() => setRejectedNotices((prev) => prev.filter((n) => n.id !== notice.id))}
              className="text-sm underline"
            >
              Dismiss
            </button>
          </div>
        ))}

        {loading && <div className="text-sm text-gray-600">Loading applications...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="border rounded-2xl p-6 text-gray-600">No applications yet.</div>
        )}

        <div className="space-y-3">
          {items.map((app) => (
            <div key={app.id} className="border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Job</div>
                <div className="font-semibold">{app.jobTitle}</div>
                <div className="text-sm text-gray-600 mt-1">{app.coverLetter}</div>
                {app.links?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {app.links.map((link) => (
                      <a key={link} href={link} className="text-sm text-blue-600 underline" target="_blank" rel="noreferrer">
                        {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full border text-xs ${STATUS_COLORS[app.status] || "text-gray-600 border-gray-200"}`}>
                  {app.status}
                </span>
                {(app.status === "Short-listed" || app.status === "Hired") && (
                  <Link href={`/dashboard/chat/${app.id}`} className="text-sm text-blue-600 hover:underline">
                    Message employer
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </main>
  )
}
