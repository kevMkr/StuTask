"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "../../../config"
import { useAuth } from "../../hooks/useAuth"
import logo from "../../../Logo.png"
import graphic from "../../../GraphicStudent.png"

function getErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try logging in instead."
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password. Please try again."
    case "auth/weak-password":
      return "Password must be at least 6 characters."
    default:
      return "Something went wrong. Please try again."
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [mode, setMode] = useState("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === "signup"
  const heading = isSignup ? "SIGN UP" : "LOGIN"
  const ctaText = isSignup ? "REGISTER" : "LOGIN"

  const derivedName = useMemo(() => email.split("@")[0] || "", [email])

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all required fields.")
      return
    }

    if (isSignup && password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      if (isSignup) {
        const credentials = await createUserWithEmailAndPassword(auth, email, password)
        if (!credentials.user.displayName) {
          await updateProfile(credentials.user, { displayName: derivedName || "New user" })
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      router.replace("/dashboard")
    } catch (err) {
      setError(getErrorMessage(err?.code))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="p-12 flex items-center">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <Image src={logo} alt="StuTask" width={120} height={36} />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 text-black">{heading}</h1>
            <p className="text-sm text-gray-600 mb-6">
              {isSignup
                ? "Join us now in becoming a member of StuTask!"
                : "Welcome back. Log in to continue to your dashboard."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#6b7280" />
                    <path d="M3 21c0-3.866 3.582-7 9-7s9 3.134 9 7" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  className="w-full border rounded-full h-12 pl-12 pr-4 placeholder-gray-400 text-black"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="10" rx="2" stroke="#6b7280" strokeWidth="1.2" />
                    <path d="M7 11V8a5 5 0 0110 0v3" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  className="w-full border rounded-full h-12 pl-12 pr-4 placeholder-gray-400 text-black"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isSignup && (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="11" width="18" height="10" rx="2" stroke="#6b7280" strokeWidth="1.2" />
                      <path d="M7 11V8a5 5 0 0110 0v3" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <input
                    className="w-full border rounded-full h-12 pl-12 pr-4 placeholder-gray-400 text-black"
                    type="password"
                    placeholder="Re-confirm Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600" aria-live="polite">{error}</p>}

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 text-white rounded-full px-6 py-3 flex items-center gap-3 disabled:opacity-70"
                >
                  <span>{submitting ? "Please wait..." : ctaText}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="flex-1 border-t" />
              </div>

              <p className="text-sm text-gray-600">
                {isSignup ? "Already registered?" : "Need an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(isSignup ? "login" : "signup")
                    setError("")
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {isSignup ? "Login" : "Create one"}
                </button>
              </p>
            </form>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center bg-[#2f7ef6] rounded-l-[80px] p-8 min-h-screen">
          <div className="max-w-xs text-center text-white">
            <Image src={graphic} alt="Graphic Student" width={8000} height={8000} className="w-full h-auto object-contain" />
          </div>
        </div>
      </div>
    </main>
  )
}
