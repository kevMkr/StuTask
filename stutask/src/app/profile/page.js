"use client"

import { useEffect } from 'react'
import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from "firebase/auth"
import { auth } from '../../../config'
import { useAuth } from '../../hooks/useAuth'
import { useUserProfile } from '../../hooks/useUserProfile'
import logo from '../../../Logo.png'

export default function ProfilePage(){
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile(user?.uid)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading || profileLoading) {
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
            <button onClick={handleSignOut} className="hover:underline">Logout</button>
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

        <section className="mt-6 bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Personalization</h2>
              <p className="text-sm text-gray-600">We use your skills to recommend better jobs.</p>
            </div>
            <Link href="/profile/personalization" className="text-sm text-blue-600 hover:underline">Edit</Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {(profile?.skills || []).length > 0 ? (
              profile.skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-600">No skills added yet. Click edit to personalize your recommendations.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
