"use client"

import Link from "next/link"
import Image from 'next/image'
import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../../../config"
import { useAuth } from "../../../hooks/useAuth"
import { formatCurrency, formatDate } from "../../../utils/jobs"
import logo from '../../../../Logo.png'

export default function FinancialsPage() {
  const { user, loading } = useAuth()
  const [gains, setGains] = useState([])
  const [spend, setSpend] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (loading || !user) return
    async function load() {
      setLoadingData(true)
      setError("")
      try {
        const snap = await getDocs(query(collection(db, "applications"), where("status", "==", "Completed")))
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const myGains = data
          .filter((d) => d.applicantId === user.uid)
          .map((d) => ({
            id: d.id,
            title: d.jobTitle || "Project",
            partner: d.employerName || "Employer",
            value: d.payout?.amount || 0,
            currency: d.payout?.currency || "IDR",
            completedOn: formatDate(d.completedAt),
          }))
        const mySpend = data
          .filter((d) => d.employerId === user.uid)
          .map((d) => ({
            id: d.id,
            title: d.jobTitle || "Project",
            partner: d.applicantName || "Student",
            value: d.payout?.amount || 0,
            currency: d.payout?.currency || "IDR",
            completedOn: formatDate(d.completedAt),
          }))
        setGains(myGains)
        setSpend(mySpend)
      } catch (err) {
        setError("Unable to load financials.")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [loading, user])

  const hasActualData = gains.length > 0 || spend.length > 0
  const gainItems = gains
  const spendItems = spend

  const totals = useMemo(() => {
    const gainTotal = gainItems.reduce((sum, item) => sum + (item.value || 0), 0)
    const spendTotal = spendItems.reduce((sum, item) => sum + (item.value || 0), 0)
    const combined = gainTotal + spendTotal
    const gainPct = combined ? Math.round((gainTotal / combined) * 100) : 0
    const spendPct = combined ? 100 - gainPct : 0
    return {
      gainTotal,
      spendTotal,
      net: gainTotal - spendTotal,
      gainPct,
      spendPct,
    }
  }, [gainItems, spendItems])

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading financials...
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Please sign in to view your financials.
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
        <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
              ← Back
            </Link>
            <h1 className="text-2xl font-semibold">Financials</h1>
            <p className="text-sm text-gray-600">
              Gains come from jobs you have completed as a student. Spend reflects jobs you have paid for as an employer.
            </p>
          </div>
          {!hasActualData && (
            <span className="px-3 py-1 rounded-full bg-gray-100 border text-xs text-gray-600">
              Showing template view
            </span>
          )}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-2xl p-5 space-y-1">
            <div className="text-xs text-gray-500">Gains (student)</div>
            <div className="text-2xl font-semibold text-blue-700">
              {formatCurrency({ amount: totals.gainTotal, currency: "IDR" })}
            </div>
            <div className="text-xs text-gray-500">From completed student jobs</div>
          </div>

          <div className="border rounded-2xl p-5 space-y-1">
            <div className="text-xs text-gray-500">Spend (employer)</div>
            <div className="text-2xl font-semibold text-amber-700">
              {formatCurrency({ amount: totals.spendTotal, currency: "IDR" })}
            </div>
            <div className="text-xs text-gray-500">Paid out to hired students</div>
          </div>

          <div className="border rounded-2xl p-5 space-y-1 bg-gray-50">
            <div className="text-xs text-gray-500">Net</div>
            <div className={`text-2xl font-semibold ${totals.net >= 0 ? "text-green-700" : "text-red-700"}`}>
              {totals.net >= 0 ? "+" : "-"} {formatCurrency({ amount: Math.abs(totals.net), currency: "IDR" })}
            </div>
            <div className="text-xs text-gray-500">Gains minus spend</div>
          </div>
        </section>

        <section className="border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold">Financial overview</div>
              <div className="text-xs text-gray-500">Gains vs spend</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500" /> Gains
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400" /> Spend
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${totals.gainPct}%` }}
              className="bg-blue-500 h-full transition-all"
            />
            <div
              style={{ width: `${totals.spendPct}%` }}
              className="bg-amber-400 h-full transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Gains {totals.gainPct}%</span>
            <span>Spend {totals.spendPct}%</span>
          </div>

          {error && <div className="text-xs text-red-600">{error}</div>}
          {!loadingData && !hasActualData && (
            <div className="text-xs text-gray-500">
              No financial activity yet. Once projects are completed, your gains and spend will appear here.
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Gains from student work</div>
                <div className="text-xs text-gray-500">Completed projects you were paid for</div>
              </div>
              <span className="text-xs text-green-700">
                {formatCurrency({ amount: totals.gainTotal, currency: "IDR" })}
              </span>
            </div>

            {gainItems.length === 0 && (
              <div className="border border-dashed rounded-xl p-4 text-sm text-gray-600 bg-gray-50">
                No gains recorded yet.
              </div>
            )}

            {gainItems.map((item) => (
              <div key={item.id} className="border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Student project</div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-500">
                      {item.partner} • {formatDate(item.completedOn)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">
                      + {formatCurrency({ amount: item.value || 0, currency: item.currency || "IDR" })}
                    </div>
                    <div className="text-[11px] text-gray-500">Paid</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Completed {item.completedOn || "-"}</div>
              </div>
            ))}
            {loadingData && (
              <div className="border border-dashed rounded-xl p-4 text-sm text-gray-600 bg-gray-50">
                Loading...
              </div>
            )}
          </div>

          <div className="border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Spend as an employer</div>
                <div className="text-xs text-gray-500">Completed projects you have funded</div>
              </div>
              <span className="text-xs text-amber-700">
                {formatCurrency({ amount: totals.spendTotal, currency: "IDR" })}
              </span>
            </div>

            {spendItems.length === 0 && (
              <div className="border border-dashed rounded-xl p-4 text-sm text-gray-600 bg-gray-50">
                No spend recorded yet.
              </div>
            )}

            {spendItems.map((item) => (
              <div key={item.id} className="border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Employer project</div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-gray-500">
                      {item.partner} • {formatDate(item.completedOn)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-700">
                      - {formatCurrency({ amount: item.value || 0, currency: item.currency || "IDR" })}
                    </div>
                    <div className="text-[11px] text-gray-500">Paid out</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Completed {item.completedOn || "-"}</div>
              </div>
            ))}
            {loadingData && (
              <div className="border border-dashed rounded-xl p-4 text-sm text-gray-600 bg-gray-50">
                Loading...
              </div>
            )}
          </div>
        </section>

        {loadingData && (
          <div className="text-xs text-gray-500">Loading financial activity...</div>
        )}
        </div>
      </div>
    </main>
  )
}
