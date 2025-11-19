"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import logo from '../../../../Logo.png'

function formatRp(n) {
  return 'Rp. ' + n.toLocaleString('id-ID')
}

function isoDate(daysOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}

function generateItems(start = 1, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const id = start + i
    const priceNumber = 1500000 + ((id * 250000) % 4000000)
    const postedOffset = -((id % 10) + 1) // posted some days ago
    const endOffset = (id % 30) + 7 // deadline in future
    return {
      id,
      person: `Person name ${id}`,
      location: "Location",
      project: `Project title ${id}`,
      role: "Role title",
      startDate: isoDate(1 + (id % 7)),
      endDate: isoDate(endOffset),
      postedDate: isoDate(postedOffset),
      priceNumber,
      price: formatRp(priceNumber),
      frequency: "Work frequency",
    }
  })
}

export default function BrowserJobsPage() {
  const [items, setItems] = useState(() => generateItems(1, 24))
  const [page, setPage] = useState(1)
  const perPage = 6

  // filters
  const [projectQuery, setProjectQuery] = useState('')
  const [minPay, setMinPay] = useState('')
  const [maxPay, setMaxPay] = useState('')
  const [deadline, setDeadline] = useState('')
  const [postedAfter, setPostedAfter] = useState('')

  // apply filters with useMemo
  const filtered = useMemo(() => {
    const q = projectQuery.trim().toLowerCase()
    return items.filter((it) => {
      if (q && !it.project.toLowerCase().includes(q) && !it.person.toLowerCase().includes(q)) return false
      if (minPay && it.priceNumber < Number(minPay)) return false
      if (maxPay && it.priceNumber > Number(maxPay)) return false
      if (deadline) {
        // include if job's endDate is on/after selected deadline
        if (new Date(it.endDate) < new Date(deadline)) return false
      }
      if (postedAfter) {
        // include if job posted on/after selected postedAfter
        if (new Date(it.postedDate) < new Date(postedAfter)) return false
      }
      return true
    })
  }, [items, projectQuery, minPay, maxPay, deadline, postedAfter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  function goToPage(p) {
    const next = Math.min(Math.max(1, p), totalPages)
    setPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function loadMore() {
    const start = items.length + 1
    const more = generateItems(start, 6)
    setItems((s) => [...s, ...more])
    // after adding items, move to last page of filtered results after a short tick
    setTimeout(() => {
      const newTotal = Math.ceil((filtered.length + more.length) / perPage)
      setPage(Math.max(1, newTotal))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 60)
  }

  function clearFilters() {
    setProjectQuery('')
    setMinPay('')
    setMaxPay('')
    setDeadline('')
    setPostedAfter('')
    setPage(1)
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

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:underline">Upgrade to Pro</a>
              <Link href="/profile" className="hover:underline">Account</Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Browse jobs</h1>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">← Back to dashboard</Link>
        </div>

        {/* Filters row (pills + inputs) */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <button className="p-2 rounded-full border bg-white text-sm">‹</button>
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
            {pageItems.map((it) => (
              <article
                key={it.id}
                className="bg-white rounded-[28px] p-6 flex items-center gap-6 shadow-sm"
                role="article"
                aria-labelledby={`job-${it.id}-title`}
              >
                <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0" />

                <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-6 md:flex-1">
                    <div>
                      <div className="font-semibold text-lg">{it.person}</div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {it.location}
                      </div>
                    </div>

                    <div className="ml-2">
                      <div id={`job-${it.id}-title`} className="font-semibold text-lg">{it.project}</div>
                      <div className="text-sm text-gray-500 mt-1">{it.role}</div>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-600 min-w-[180px]">
                    <div className="whitespace-nowrap">{it.startDate} <span className="mx-2">→</span> {it.endDate}</div>
                    <div className="mt-2">{it.price}</div>
                    <div className="text-xs mt-1">{it.frequency}</div>
                  </div>
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
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
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm ${p === page ? 'bg-white text-blue-600 font-semibold' : 'bg-white/80 text-gray-700'}`}
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
            >
              Load more
            </button>

            <div className="text-sm text-gray-600">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}