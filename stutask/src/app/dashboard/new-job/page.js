"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from '../../../../config'
import { useAuth } from '../../../hooks/useAuth'

const categoryOptions = [
  "Frontend",
  "Backend",
  "Mobile",
  "Data",
  "Design",
  "Marketing",
  "Product",
]

export default function NewJobPage(){
  const router = useRouter()
  const { user, loading } = useAuth()

  const [form, setForm] = useState({
    title: '',
    role: '',
    startDate: '',
    endDate: '',
    payout: '',
    currency: 'IDR',
    description: '',
    categories: [],
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSkill(skill) {
    setForm((prev) => {
      const exists = prev.categories.includes(skill)
      const categories = exists
        ? prev.categories.filter((s) => s !== skill)
        : [...prev.categories, skill]
      return { ...prev, categories }
    })
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title || !form.role || !form.description || !form.startDate || !form.endDate || !form.payout || !form.currency) {
      setError('Please fill in all required fields.')
      return
    }

    if (!user) {
      setError('You must be signed in to post a job.')
      return
    }

    setSubmitting(true)
    try {
      const docRef = await addDoc(collection(db, "jobs"), {
        title: form.title,
        role: form.role,
        startDate: form.startDate,
        endDate: form.endDate,
        payout: {
          amount: Number(form.payout),
          currency: form.currency,
        },
        description: form.description,
        categories: form.categories,
        createdBy: {
          uid: user.uid,
          fullName: user.displayName || user.email,
          email: user.email,
        },
        createdAt: serverTimestamp(),
      })

      setSuccess('Job published!')
      setForm({
        title: '',
        role: '',
        startDate: '',
        endDate: '',
        payout: '',
        currency: 'IDR',
        description: '',
        categories: [],
      })

      // Navigate to job list or dashboard
      router.push("/dashboard/jobs")
    } catch (err) {
      setError('Unable to publish job. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || (!user && !error)) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Preparing editor...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Create new job post</h1>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">Back</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white border rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Job title</label>
              <input
                value={form.title}
                onChange={(e)=>handleChange('title', e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Frontend Developer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role title</label>
              <input
                value={form.role}
                onChange={(e)=>handleChange('role', e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="React Engineer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e)=>handleChange('startDate', e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e)=>handleChange('endDate', e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Proposed payout</label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={form.currency}
                  onChange={(e)=>handleChange('currency', e.target.value)}
                  className="border rounded-2xl px-4 py-3 col-span-1 appearance-none"
                  required
                >
                  <option value="IDR">IDR</option>
                  <option value="SGD">SGD</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.payout}
                  onChange={(e)=>handleChange('payout', e.target.value)}
                  className="w-full border rounded-2xl px-4 py-3 col-span-2"
                  placeholder="3000"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e)=>handleChange('description', e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 h-32"
              placeholder="Describe the project, expectations, deliverables..."
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2">Categories</label>
            <button
              type="button"
              onClick={() => setCategoriesOpen((o) => !o)}
              className="w-full border rounded-2xl px-4 py-3 flex items-center justify-between text-left min-h-[52px]"
            >
              <span className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
                {form.categories.length > 0 ? (
                  form.categories.map((cat) => (
                    <span key={cat} className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Select categories</span>
                )}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {categoriesOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border rounded-2xl shadow-lg p-4 space-y-3">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full border rounded-2xl px-3 py-2 text-sm"
                  placeholder="Search categories..."
                />
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {categoryOptions
                    .filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((category) => {
                      const selected = form.categories.includes(category)
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleSkill(category)}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                            selected ? "bg-blue-50 border-blue-300 text-blue-700" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-sm">{category}</span>
                          {selected && <span className="ml-2 text-xs text-blue-600">(selected)</span>}
                        </button>
                      )
                    })}
                  {categoryOptions.filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-1">No categories found.</div>
                  )}
                </div>
              </div>
            )}

          </div>

          {error && <p className="text-sm text-red-600" aria-live="polite">{error}</p>}
          {success && <p className="text-sm text-green-600" aria-live="polite">{success}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-4 py-2 rounded-2xl disabled:opacity-70"
            >
              {submitting ? 'Publishing...' : 'Publish job'}
            </button>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
