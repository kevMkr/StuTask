"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from "firebase/auth"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { auth } from "../../../config"
import { db } from "../../../config"
import { useAuth } from "../../hooks/useAuth"
import { useUserProfile } from "../../hooks/useUserProfile"
import { formatCurrency } from "../../utils/jobs"
import logo from '../../../Logo.png'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('student')
  const [signOutError, setSignOutError] = useState("")
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState("")
  const { profile, loading: profileLoading } = useUserProfile(user?.uid)
  const hasSkills = (profile?.skills || []).length > 0

  const fullName = user?.displayName || user?.email?.split("@")[0] || "there"
  const displayName = fullName.split(" ")[0] || fullName

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    async function loadJobs() {
      if (!user) return
      setJobsLoading(true)
      setJobsError("")
      try {
        const q = query(
          collection(db, "jobs"),
          orderBy("createdAt", "desc"),
          limit(20) // grab more so personalization still has options
        )
        const snap = await getDocs(q)
        const items = snap.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data?.title || "Untitled",
            role: data?.role || "",
            payout: data?.payout || { amount: 0, currency: "USD" },
            categories: data?.categories || [],
            createdBy: data?.createdBy || {},
            status: data?.status || "open",
            maxProposals: data?.maxProposals || null,
            ownerUid: data?.createdBy?.uid || "",
          }
        })
        const filtered = items.filter((job) => job.ownerUid !== user.uid)
        setJobs(filtered)
      } catch (err) {
        setJobsError("Unable to load jobs.")
      } finally {
        setJobsLoading(false)
      }
    }
    loadJobs()
  }, [user])

  const personalizedJobs = useMemo(() => {
    const skills = (profile?.skills || []).map((s) => s.toLowerCase())
    if (skills.length === 0) {
      return jobs.slice(0, 4)
    }

    const minimumMatches = Math.ceil(skills.length * 0.5)
    const filtered = jobs.filter((job) => {
      const categories = (job.categories || []).map((c) => c.toLowerCase())
      const matches = categories.filter((cat) => skills.includes(cat)).length
      return matches >= minimumMatches
    })

    return filtered.slice(0, 4)
  }, [jobs, profile])

  async function handleSignOut() {
    setSignOutError("")
    try {
      await signOut(auth)
      router.replace("/login")
    } catch (err) {
      setSignOutError("Unable to sign out. Please try again.")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Checking authentication...
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Redirecting to login...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="w-full py-4 border-b">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="StuTask" width={120} height={36} />
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-6">
            <Link href="/profile" className="hover:underline">Account</Link>
            <button onClick={handleSignOut} className="text-gray-700 hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Welcome, <span className="text-yellow-400">{displayName}</span></h2>

          {signOutError && <span className="text-sm text-red-600">{signOutError}</span>}

          {/* Tab list (Student / Employer) */}
          <div role="tablist" aria-label="User role tabs" className="flex items-center gap-3">
            <button
              role="tab"
              id="tab-student"
              aria-selected={tab === 'student'}
              aria-controls="panel-student"
              className={`px-3 py-1 rounded-full focus:outline-none ${
                tab === 'student' ? 'bg-gray-100' : 'bg-white border'
              }`}
              onClick={() => setTab('student')}
            >
              Student
            </button>

            <button
              role="tab"
              id="tab-employer"
              aria-selected={tab === 'employer'}
              aria-controls="panel-employer"
              className={`px-3 py-1 rounded-full focus:outline-none ${
                tab === 'employer' ? 'bg-gray-100' : 'bg-white border'
              }`}
              onClick={() => setTab('employer')}
            >
              Employer
            </button>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-6">
          {/* Panels */}
          <div className="grid grid-cols-2 w-full gap-4">
            <div >
              {/* Student panel */}
              <section
                id="panel-student"
                role="tabpanel"
                className='grid grid-cols-2 gap-2'
                aria-labelledby="tab-student"
                hidden={tab !== 'student'}
              >
                <div className="relative p-6 bg-blue-500 text-white rounded-2xl">
                  <div className="text-3xl font-bold">2</div>
                  <div className="text-sm mt-1">Active projects</div>
                  <Link href="/dashboard/projects" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open Active projects">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>

                <div className="relative p-6 bg-white border rounded-2xl">
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-sm mt-1 text-gray-600">Pending approvals</div>
                  <Link href="/dashboard/approvals" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open Pending approvals">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>

                <div className="relative p-6 bg-white border rounded-2xl">
                  <div className="text-3xl font-bold">12</div>
                  <div className="text-sm mt-1 text-gray-600">Completed projects</div>
                  <Link href="/dashboard/completed" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open Completed projects">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>

                <div className="relative p-6 bg-white border rounded-2xl">
                  <div className="text-3xl font-bold">Rp. 3,750,000</div>
                  <div className="text-sm mt-1 text-gray-600">Gains</div>
                  <Link href="/dashboard/gains" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open Gains">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>
              </section>

              {/* Employer panel (hidden when student active) */}
              <section
                id="panel-employer"
                role="tabpanel"
                className='grid grid-cols-2 gap-2'
                aria-labelledby="tab-employer"
                hidden={tab !== 'employer'}
              >
                <div className="relative p-6 bg-green-500 text-white rounded-2xl">
                  <div className="text-3xl font-bold">8</div>
                  <div className="text-sm mt-1">Open positions</div>
                  <Link href="/dashboard/positions" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open positions">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>

                <div className="relative p-6 bg-white border rounded-2xl">
                  <div className="text-3xl font-bold">34</div>
                  <div className="text-sm mt-1 text-gray-600">Applicants</div>
                  <Link href="/dashboard/applicants" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open applicants">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>

                <div className="relative p-6 bg-white border rounded-2xl">
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-sm mt-1 text-gray-600">Hires</div>
                  <Link href="/dashboard/hires" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open hires">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>

                <div className="relative p-6 bg-white border rounded-2xl">
                  <div className="text-3xl font-bold">Rp. 12,500,000</div>
                  <div className="text-sm mt-1 text-gray-600">Spend</div>
                  <Link href="/dashboard/spend" className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center text-black" aria-label="Open spend">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </Link>
                </div>
              </section>
            </div>

            <div className="relative p-6 bg-white border rounded-2xl w-full h-full">
              <div className="text-sm text-gray-500">Most recent work</div>
            </div>
          </div>

          <aside>
            {tab === 'employer' ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">New job post</h3>
                <Link href="/dashboard/new-job" className="block" aria-label="Create new job">
                  <div className="rounded-2xl border border-gray-300 p-6 h-20 flex items-center justify-center hover:border-gray-400 focus:outline-none">
                    <span className="text-2xl font-bold">+</span>
                  </div>
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recommended jobs</h3>
                  <Link
                    href="/dashboard/jobs"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    View more <span aria-hidden className="text-xs">›</span>
                  </Link>
                </div>

                <div className="bg-blue-500 p-4 rounded-3xl space-y-4">
                  {profileLoading && <div className="text-white text-sm">Loading your preferences...</div>}
                  {jobsLoading && <div className="text-white text-sm">Loading jobs...</div>}
                  {jobsError && <div className="text-white text-sm">{jobsError}</div>}
                  {!jobsLoading && !jobsError && personalizedJobs.length === 0 && (
                    <div className="bg-white rounded-xl p-4 text-sm text-gray-600">
                      {hasSkills ? "No jobs match your skills yet." : "No jobs yet."}
                    </div>
                  )}
                  {!jobsLoading && personalizedJobs.map((job)=> (
                    <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition">
                      <div className="w-12 h-12 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Recommended</div>
                        <div className="font-semibold">{job.createdBy?.fullName || job.createdBy?.email || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{job.title} • {job.role}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(job.categories || []).map((cat) => (
                            <span key={cat} className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                              {cat}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full border ${job.status === "open" ? "border-green-500 text-green-600" : "border-gray-400 text-gray-600"}`}>
                            {job.status === "open" ? "Open" : "Closed"}
                          </span>
                          {job.maxProposals ? <span>Max proposals: {job.maxProposals}</span> : null}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 text-right min-w-[110px]">
                        <div className="font-semibold">{formatCurrency(job.payout)}</div>
                        <div className="text-xs text-gray-500">Estimated budget</div>
                      </div>
                    </Link>
                  ))}
                  {!hasSkills && !jobsLoading && !jobsError && (
                    <div className="bg-white/20 text-white text-sm rounded-xl p-4 border border-white/30">
                      Add your skills on the <Link href="/profile/personalization" className="underline font-semibold">personalization page</Link> to tailor recommendations.
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}
