"use client"

import { useState } from 'react'
import Link from 'next/link'

export default function NewJobPage(){
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  function handleSubmit(e){
    e.preventDefault()
    // TODO: wire to an API route to save the job
    alert('Job submitted (demo). Title: ' + title)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Create new job post</h1>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">Back</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium mb-1">Job title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. Frontend developer" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-32" />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Publish job</button>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
