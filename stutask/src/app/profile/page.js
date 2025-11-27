"use client"

import { useEffect } from 'react'
import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from "firebase/auth"
import { auth } from '../../../config'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../../Logo.png'

export default function ProfilePage(){
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Loading profile...
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        Redirecting...
      </main>
    )
  }

  const fullName = user.displayName || user.email?.split("@")[0] || "User"
  const name = fullName.split(" ")[0] || fullName

  async function handleSignOut() {
    try {
      await signOut(auth)
      router.replace("/login")
    } catch (err) {
      // swallow error; dashboard already exposes sign-out feedback
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="w-full py-4 border-b">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src={logo} alt="StuTask" width={120} height={36} />
            </Link>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <Link href="/dashboard" className="hover:underline">Back</Link>
            <button onClick={handleSignOut} className="hover:underline">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold">
            {name?.[0]?.toUpperCase() || "U"}
          </div>

          <div>
            <h1 className="text-2xl font-semibold">{name}</h1>
            <div className="text-sm text-gray-600">{user.email}</div>
            <div className="mt-4">
              <Link href="/profile/edit" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Edit profile</Link>
            </div>
          </div>
        </div>

        <section className="mt-8 bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-sm text-gray-600">Your profile uses the details from your StuTask account. Add more fields when you connect a real profile store.</p>
        </section>
      </div>
    </main>
  )
}
