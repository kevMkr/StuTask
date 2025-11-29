"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore"
import { db } from "../../../../../config"
import { useAuth } from "../../../../hooks/useAuth"

export default function ChatPage() {
  const { appId } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [app, setApp] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const bottomRef = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    let unsubscribe = null
    async function load() {
      try {
        const snap = await getDoc(doc(db, "applications", appId))
        if (!snap.exists()) {
          setError("Application not found.")
          return
        }
        const data = { id: snap.id, ...snap.data() }
        if (![data.applicantId, data.employerId].includes(user?.uid)) {
          setError("You are not part of this application.")
          return
        }
        setApp(data)

        const q = query(
          collection(db, "messages"),
          where("applicationId", "==", appId),
          orderBy("createdAt", "asc")
        )
        unsubscribe = onSnapshot(q, (snapshot) => {
          const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          setMessages(rows)
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
        })
      } catch (err) {
        setError("Unable to load chat.")
      }
    }
    load()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [appId, user])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || !app) return
    try {
      await addDoc(collection(db, "messages"), {
        applicationId: appId,
        applicantId: app.applicantId,
        employerId: app.employerId,
        text: text.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
      setText("")
    } catch (err) {
      setError("Unable to send message.")
    }
  }

  if (authLoading || !app) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        {error ? error : "Loading chat..."}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-6 space-y-4">
        <Link href={user.uid === app.employerId ? "/dashboard/applicants" : "/dashboard/approvals"} className="text-sm text-gray-600 hover:underline">
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Chat about {app.jobTitle}</h1>
          <p className="text-sm text-gray-600">With {user.uid === app.employerId ? app.applicantName : app.employerName}</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="border rounded-2xl p-4 h-[60vh] overflow-y-auto space-y-3 bg-gray-50">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.senderId === user.uid ? "ml-auto bg-blue-600 text-white" : "bg-white border"}`}>
              <div className="text-[11px] opacity-80">{m.senderName}</div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            className="flex-1 border rounded-full px-4 py-2"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-full">Send</button>
        </form>
      </div>
    </main>
  )
}
