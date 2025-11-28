"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import { formatCurrency, formatDate } from "../../../utils/jobs"
import logo from '../../../../Logo.png'

const PAGE_SIZE = 6

export default function BrowserJobsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  // filters
  const [projectQuery, setProjectQuery] = useState('')
  const [minPay, setMinPay] = useState('')
  const [maxPay, setMaxPay] = useState('')
  const [deadline, setDeadline] = useState('')
  const [postedAfter, setPostedAfter] = useState('')

  const loadJobs = useCallback(async (cursor) => {
    if (!user) return
    const isLoadMore = Boolean(cursor)
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError("")
    try {
      const q = cursor
        ? query(collection(db, "jobs"), orderBy("createdAt", "desc"), startAfter(cursor), limit(PAGE_SIZE))
        : query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(PAGE_SIZE))
      const snap = await getDocs(q)
      const docs = snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          person: data?.createdBy?.fullName || data?.createdBy?.email || "Unknown",
          project: data?.title || "Untitled",
          role: data?.role || "",
          postedDate: formatDate(data?.createdAt),
          payout: data?.payout,
          priceNumber: Number(data?.payout?.amount) || 0,
          price: formatCurrency(data?.payout || { amount: 0, currency: "USD" }),
          frequency: "",
          categories: data?.categories || [],
          status: data?.status || "open",
          maxProposals: data?.maxProposals || null,
          ownerUid: data?.createdBy?.uid || "",
        }
      })

      const filteredDocs = docs.filter((it) => it.ownerUid !== user.uid)
      setItems((prev) => (isLoadMore ? [...prev, ...filteredDocs] : filteredDocs))
      const last = snap.docs[snap.docs.length - 1] || null
      setLastDoc(last)
      setHasMore(snap.docs.length === PAGE_SIZE)
    } catch (err) {
      setError("Unable to load jobs.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadJobs()
  }, [authLoading, user, loadJobs])

  // apply filters with useMemo (client-side on loaded jobs)
  const filtered = useMemo(() => {
    const q = projectQuery.trim().toLowerCase()
    return items.filter((it) => {
      if (q && !it.project.toLowerCase().includes(q) && !it.person.toLowerCase().includes(q)) return false
      if (minPay && it.priceNumber < Number(minPay)) return false
      if (maxPay && it.priceNumber > Number(maxPay)) return false
      if (deadline) {
        if (new Date(it.endDate) < new Date(deadline)) return false
      }
      if (postedAfter) {
        if (new Date(it.postedDate) < new Date(postedAfter)) return false
      }
      return true
    })
  }, [items, projectQuery, minPay, maxPay, deadline, postedAfter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function goToPage(p) {
    const next = Math.min(Math.max(1, p), totalPages)
    setPage(next)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    await loadJobs(lastDoc)
    setPage((prev) => prev + 1)
  }

  function clearFilters() {
    setProjectQuery('')
    setMinPay('')
    setMaxPay('')
    setDeadline('')
    setPostedAfter('')
    setPage(1)
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Preparing jobs...
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Please sign in to view jobs.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* top bar with logo */}
        <header className="mb-6">
          <div className="flex items-center justify-between border rounded-full py-3 px-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <img src={logo.src || logo} alt="StuTask" className="w-32 h-auto" />
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Browse jobs</h1>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">← &nbsp; Back</Link>
        </div>

        {/* Filters row (pills + inputs) */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex gap-3">
              {/* Project title becomes input */}
              <input
                aria-label="Project title"
                value={projectQuery}
                onChange={(e) => { setProjectQuery(e.target.value); setPage(1) }}
                placeholder="Project title..."
                className="px-4 py-2 rounded-full border bg-white text-sm min-w-[200px]"
              />

              {/* Pay range as two small inputs */}
              <div className="flex items-center gap-2">
                <input
                  aria-label="Min pay"
                  value={minPay}
                  onChange={(e) => { setMinPay(e.target.value.replace(/\D/g, '')); setPage(1) }}
                  placeholder="Min pay"
                  className="px-3 py-2 rounded-full border bg-white text-sm w-28"
                />
                <span className="text-sm text-gray-500">—</span>
                <input
                  aria-label="Max pay"
                  value={maxPay}
                  onChange={(e) => { setMaxPay(e.target.value.replace(/\D/g, '')); setPage(1) }}
                  placeholder="Max pay"
                  className="px-3 py-2 rounded-full border bg-white text-sm w-28"
                />
              </div>

              {/* Deadline and Posted date as date inputs */}
              <input
                type="date"
                aria-label="Deadline"
                value={deadline}
                onChange={(e) => { setDeadline(e.target.value); setPage(1) }}
                className="px-4 py-2 rounded-full border bg-white text-sm"
              />
              <input
                type="date"
                aria-label="Posted after"
                value={postedAfter}
                onChange={(e) => { setPostedAfter(e.target.value); setPage(1) }}
                className="px-4 py-2 rounded-full border bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(1)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
            >
              Search
            </button>

            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border bg-white text-sm"
            >
              Clear
            </button>

            <div className="text-sm text-gray-600 ml-auto">
              {filtered.length} results
            </div>
          </div>
        </div>

        {/* Blue container with rounded jobs */}
        <div className="bg-blue-500 p-8 rounded-[40px]">
          <div className="space-y-6">
            {loading && <div className="text-white text-sm">Loading jobs...</div>}
            {error && <div className="bg-white rounded-lg p-6 text-center text-red-600">{error}</div>}
            {!loading && !error && pageItems.map((it) => (
              <Link
                href={`/dashboard/jobs/${it.id}`}
                key={it.id}
                className="bg-white rounded-[28px] p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition"
                role="article"
                aria-labelledby={`job-${it.id}-title`}
              >
                <div className="w-24 h-24 rounded-full bg-gray-200" />

                <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-6 md:flex-1">
                    <div>
                      <div className="font-semibold text-lg">{it.person}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(it.categories || []).map((cat) => (
                        <span key={cat} className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {cat}
                        </span>
                      ))}
                    </div>
                    </div>

                    <div className="ml-2">
                      <div id={`job-${it.id}-title`} className="font-semibold text-lg">{it.project}</div>
                      <div className="text-sm text-gray-500">{it.role}</div>
                      <div className="text-xs text-gray-500 mt-3">Posted {it.postedDate || "—"}</div>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-600 min-w-[180px]">
                    <div className="mt-1 text-xs text-gray-500">Estimated budget</div>
                    <div className="whitespace-nowrap font-semibold">{it.price}</div>
                    <div className="mt-2 inline-flex items-center justify-end gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full border ${it.status === "open" ? "border-green-500 text-green-600" : "border-gray-400 text-gray-600"}`}>
                        {it.status === "open" ? "Open" : "Closed"}
                      </span>
                      {it.maxProposals ? <span className="text-gray-500">Max proposals: {it.maxProposals}</span> : null}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {!loading && !error && filtered.length === 0 && (
              <div className="bg-white rounded-lg p-6 text-center text-gray-600">No jobs match your filters.</div>
            )}
          </div>
        </div>

        {/* Pagination / Actions */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
            >
              Prev
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm ${p === safePage ? 'bg-white text-blue-600 font-semibold' : 'bg-white/80 text-gray-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadMore}
              className="px-4 py-2 rounded-lg bg-white text-sm text-blue-600 border"
              disabled={!hasMore || loadingMore}
            >
              {loadingMore ? 'Loading...' : hasMore ? 'Load more' : 'No more'}
            </button>

            <div className="text-sm text-gray-600">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
