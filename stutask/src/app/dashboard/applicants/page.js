"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from 'next/image'
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import logo from '../../../../Logo.png'

const STATUS_COLORS = {
  Pending: "text-yellow-600 bg-yellow-50 border-yellow-100",
  "Short-listed": "text-green-600 bg-green-50 border-green-100",
  Rejected: "text-red-600 bg-red-50 border-red-100",
  Hired: "text-green-700 bg-green-50 border-green-200",
}

export default function ApplicantsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState("")
  const [confirm, setConfirm] = useState({ open: false, appId: "", next: "" })
  const [hireConfirm, setHireConfirm] = useState({ open: false, app: null })
  const [hiringId, setHiringId] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    async function load() {
      setLoading(true)
      setError("")
      try {
        const q = query(
          collection(db, "applications"),
          where("employerId", "==", user.uid),
          orderBy("createdAt", "desc")
        )
        const snap = await getDocs(q)
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setItems(data)
      } catch (err) {
        setError("Unable to load applicants.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user])

  async function updateStatus(appId, status) {
    setUpdatingId(appId)
    try {
      await updateDoc(doc(db, "applications", appId), { status })
      setItems((prev) => prev.map((it) => (it.id === appId ? { ...it, status } : it)))
    } catch (err) {
      setError("Unable to update status.")
    } finally {
      setUpdatingId("")
      setConfirm({ open: false, appId: "", next: "" })
    }
  }

  async function confirmHire(app) {
    if (!app?.id || !app?.jobId) return
    setHiringId(app.id)
    setError("")
    try {
      await updateDoc(doc(db, "applications", app.id), { status: "Hired", hiredAt: new Date() })
      try {
        await updateDoc(doc(db, "jobs", app.jobId), { status: "closed" })
      } catch {
        // If the job close fails, continue so the hire flow completes
      }
      const others = items.filter((it) => it.jobId === app.jobId && it.id !== app.id)
      await Promise.all(
        others.map((it) => deleteDoc(doc(db, "applications", it.id)))
      )
      setItems((prev) =>
        prev
          .filter((it) => it.jobId !== app.jobId || it.id === app.id)
          .map((it) => (it.id === app.id ? { ...it, status: "Hired" } : it))
      )
    } catch (err) {
      setError("Unable to confirm hire. Please try again.")
    } finally {
      setHiringId("")
      setHireConfirm({ open: false, app: null })
    }
  }

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
          <h1 className="text-2xl font-semibold">Applicants</h1>
          <p className="text-sm text-gray-600">List of applicants that took interest of your job.</p>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading applicants...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="border rounded-2xl p-6 text-gray-600">No applications yet.</div>
        )}

        {items.filter((a) => a.status !== "Hired").length === 0 && !loading && (
          <div className="border rounded-2xl p-6 text-gray-600">No active applicants right now.</div>
        )}

        <div className="space-y-4">
          {Object.values(
            items
              .filter((app) => app.status !== "Hired")
              .reduce((groups, app) => {
                const key = app.jobId
                if (!groups[key]) {
                  groups[key] = { jobId: app.jobId, jobTitle: app.jobTitle, apps: [] }
                }
                groups[key].apps.push(app)
                return groups
              }, {})
          ).map((group) => (
            <div key={group.jobId || group.jobTitle} className="border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Project</div>
                  <div className="font-semibold">{group.jobTitle || "Untitled project"}</div>
                </div>
              </div>

              <div className="space-y-3">
                {group.apps.map((app) => (
                  <div key={app.id} className="border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-gray-500">Applicant</div>
                        <div className="font-semibold">{app.applicantName}</div>
                        <div className="text-xs text-gray-500 mt-1">Applied: {app.createdAt?.toDate?.()?.toISOString?.()?.slice(0,10) || "—"}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full border text-xs ${STATUS_COLORS[app.status] || "text-gray-600 border-gray-200"}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700">{app.coverLetter}</div>
                    {app.links?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {app.links.map((link) => (
                          <a key={link} href={link} className="text-sm text-blue-600 underline" target="_blank" rel="noreferrer">
                            {link}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {app.status === "Pending" && (
                        <>
                          <button
                            onClick={() => setConfirm({ open: true, appId: app.id, next: "Short-listed" })}
                            disabled={updatingId === app.id}
                            className="px-3 py-2 rounded border text-sm text-gray-700 hover:border-green-500 disabled:opacity-60"
                          >
                            Short-list
                          </button>
                          <button
                            onClick={() => setConfirm({ open: true, appId: app.id, next: "Rejected" })}
                            disabled={updatingId === app.id}
                            className="px-3 py-2 rounded border text-sm text-gray-700 hover:border-red-500 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(app.status === "Short-listed") && (
                        <>
                          <Link
                            href={`/dashboard/applicants/${app.id}/profile`}
                            className="px-3 py-2 rounded border text-sm text-blue-600 hover:border-blue-500"
                          >
                            View profile
                          </Link>
                          <Link
                            href={`/dashboard/chat/${app.id}`}
                            className="px-3 py-2 rounded border text-sm text-blue-600 hover:border-blue-500"
                          >
                            Message
                          </Link>
                          <button
                            onClick={() => setHireConfirm({ open: true, app })}
                            disabled={hiringId === app.id}
                            className="px-3 py-2 rounded border text-sm text-green-700 hover:border-green-600 disabled:opacity-60"
                          >
                            Confirm hire
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {confirm.open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-lg">
              <div className="text-lg font-semibold">Confirm decision</div>
              <p className="text-sm text-gray-600">
                Are you sure you want to mark this application as {confirm.next}? This cannot be changed.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirm({ open: false, appId: "", next: "" })}
                  className="px-3 py-2 rounded border text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatus(confirm.appId, confirm.next)}
                  className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-70"
                  disabled={updatingId === confirm.appId}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {hireConfirm.open && hireConfirm.app && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-lg">
              <div className="text-lg font-semibold">Confirm hire</div>
              <p className="text-sm text-gray-600">
                Hiring {hireConfirm.app.applicantName} will reject and remove all other applicants for this job. This action
                cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setHireConfirm({ open: false, app: null })}
                  className="px-3 py-2 rounded border text-sm"
                  disabled={hiringId === hireConfirm.app.id}
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmHire(hireConfirm.app)}
                  className="px-3 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-70"
                  disabled={hiringId === hireConfirm.app.id}
                >
                  Confirm hire
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  )
}
