"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../../../../../config"
import { useAuth } from "../../../../hooks/useAuth"
import { SKILL_OPTIONS } from "../../../../constants/skills"

export default function EditPositionPage() {
  const router = useRouter()
  const { jobId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState({
    title: "",
    role: "",
    payout: "",
    currency: "IDR",
    description: "",
    categories: [],
    maxProposals: "",
    status: "open",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [categoriesOpen, setCategoriesOpen] = useState(false)

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
          return
        }
        const data = snap.data()
        if (data?.createdBy?.uid !== user.uid) {
          setError("You cannot edit this job.")
          return
        }
        setForm({
          title: data?.title || "",
          role: data?.role || "",
          payout: data?.payout?.amount || "",
          currency: data?.payout?.currency || "IDR",
          description: data?.description || "",
          categories: data?.categories || [],
          maxProposals: data?.maxProposals || "",
          status: data?.status || "open",
        })
      } catch (err) {
        setError("Unable to load job.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [authLoading, user, jobId, router])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSkill(skill) {
    setForm((prev) => {
      const exists = prev.categories.includes(skill)
      const categories = exists ? prev.categories.filter((s) => s !== skill) : [...prev.categories, skill]
      return { ...prev, categories }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!user) return

    if (!form.title || !form.role || !form.description || !form.payout || !form.currency || !form.maxProposals) {
      setError("Please fill all required fields.")
      return
    }

    setSaving(true)
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        title: form.title,
        role: form.role,
        payout: {
          amount: Number(form.payout),
          currency: form.currency,
        },
        description: form.description,
        categories: form.categories,
        maxProposals: Number(form.maxProposals),
        status: form.status,
      })
      router.replace("/dashboard/positions")
    } catch (err) {
      setError("Unable to save changes.")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading...
      </main>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        {error}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Edit job post</h1>
          <Link href="/dashboard/positions" className="text-sm text-gray-600 hover:underline">Back</Link>
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
              <label className="block text-sm font-medium mb-1">Estimated budget</label>
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
            <div>
              <label className="block text-sm font-medium mb-1">Max proposals</label>
              <input
                type="number"
                min="1"
                value={form.maxProposals}
                onChange={(e)=>handleChange('maxProposals', e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="e.g. 10"
                required
              />
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
                  {SKILL_OPTIONS
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
                  {SKILL_OPTIONS.filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-1">No categories found.</div>
                  )}
                </div>
              </div>
            )}

          </div>

          {error && <p className="text-sm text-red-600" aria-live="polite">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 text-white px-4 py-2 rounded-2xl disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <Link href="/dashboard/positions" className="text-sm text-gray-600 hover:underline">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
