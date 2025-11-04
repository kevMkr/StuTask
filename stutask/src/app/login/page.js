"use client"

import { useState } from "react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    setError("")
    // Simple validation similar to the design: require fields and confirm match
    if (!email || !password) {
      setError("Please fill in all required fields.")
      return
    }
    // If confirm field exists (signup) check match
    if (confirm && password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    // TODO: replace with real auth integration
    // For now just log values
    // eslint-disable-next-line no-console
    console.log({ email, password })
    alert("Form submitted (see console). Implement auth integration next.")
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2">
        {/* Left - form */}
        <div className="p-12">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">S</div>
              <span className="font-semibold text-lg">StuTask</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">SIGN UP</h1>
          <p className="text-sm text-gray-600 mb-6">Join us now in becoming a member of StuTask!</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {/* user icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#6b7280" />
                  <path d="M3 21c0-3.866 3.582-7 9-7s9 3.134 9 7" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                className="w-full border rounded-full h-12 pl-12 pr-4 placeholder-gray-400"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {/* lock icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="10" rx="2" stroke="#6b7280" strokeWidth="1.2" />
                  <path d="M7 11V8a5 5 0 0110 0v3" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                className="w-full border rounded-full h-12 pl-12 pr-4 placeholder-gray-400"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {/* lock icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="10" rx="2" stroke="#6b7280" strokeWidth="1.2" />
                  <path d="M7 11V8a5 5 0 0110 0v3" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                className="w-full border rounded-full h-12 pl-12 pr-4 placeholder-gray-400"
                type="password"
                placeholder="Re-confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-4">
              <button type="submit" className="bg-blue-500 text-white rounded-full px-6 py-3 flex items-center gap-3">
                <span>REGISTER</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex-1 border-t" />
            </div>

            <p className="text-sm text-gray-600">Already registered? <Link href="/login" className="text-blue-600 hover:underline">Login</Link></p>
          </form>
        </div>

        {/* Right - illustration */}
        <div className="hidden md:flex items-center justify-center bg-[#2f7ef6] rounded-l-[80px] p-8">
          <div className="max-w-xs text-center text-white">
            {/* Decorative illustration placeholder */}
            <svg viewBox="0 0 200 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="200" height="140" rx="20" fill="#2f7ef6" />
              <g transform="translate(10,12)">
                <rect x="10" y="10" width="120" height="70" rx="6" fill="#fff" opacity="0.9"/>
                <circle cx="150" cy="90" r="28" fill="#fff" opacity="0.9"/>
                <rect x="24" y="24" width="40" height="8" rx="3" fill="#2f7ef6"/>
                <rect x="24" y="38" width="80" height="8" rx="3" fill="#2f7ef6"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </main>
  )
}
