"use client"

import { useState } from "react"
import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../Logo.png'

export default function DashboardPage() {
  const [tab, setTab] = useState('student')
  const [showMore, setShowMore] = useState(false) // added state to toggle recommended list

  const recommendedItems = showMore
    ? Array.from({ length: 8 }, (_, i) => i + 1)
    : [1, 2, 3, 4]

  return (
    <main className="min-h-screen bg-white">
      <header className="w-full py-4 border-b">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="StuTask" width={120} height={36} />
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-6">
            <a href="#" className="hover:underline">Upgrade to Pro</a>
            <Link href="/profile" className="hover:underline">Account</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Welcome, <span className="text-yellow-400">Kevin</span></h2>

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
                  {recommendedItems.map((i)=> (
                    <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Recommended</div>
                        <div className="font-semibold">Person name</div>
                        <div className="text-xs text-gray-500">Project title • Role title</div>
                      </div>
                      <div className="text-sm text-gray-600">Start date<br/>Rp. 3,000,000</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}
