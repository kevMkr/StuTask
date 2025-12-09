"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
} from "firebase/firestore"
import { db } from "../../../../../config"
import { useAuth } from "../../../../hooks/useAuth"
import { formatCurrency } from "../../../../utils/jobs"

export default function ChatPage() {
  const { appId } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [app, setApp] = useState(null)
  const [jobCurrency, setJobCurrency] = useState("IDR")
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [proposalOpen, setProposalOpen] = useState(false)
  const [proposalAmount, setProposalAmount] = useState("")
  const [proposalCurrency, setProposalCurrency] = useState("IDR")
  const [proposalSubmitting, setProposalSubmitting] = useState(false)
  const [respondingId, setRespondingId] = useState("")
  const [actionLoading, setActionLoading] = useState("")
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [olderLoading, setOlderLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [oldestDoc, setOldestDoc] = useState(null)
  const [projectEnded, setProjectEnded] = useState(false)
  const bottomRef = useRef(null)
  const initialLoadedRef = useRef(false)

  const MESSAGE_PAGE_SIZE = 50

  const messagesRef = appId ? collection(db, "applications", appId, "messages") : null

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user || !messagesRef) return
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

        if (data?.jobId) {
          try {
            const jobSnap = await getDoc(doc(db, "jobs", data.jobId))
            const payoutCurrency = jobSnap?.data()?.payout?.currency
            if (payoutCurrency) {
              setJobCurrency(payoutCurrency)
              setProposalCurrency(payoutCurrency)
            }
          } catch {
            // Ignore job fetch errors to avoid blocking chat
          }
        }

        // initial load: latest page
        if (!initialLoadedRef.current) setLoadingMessages(true)
        const initialSnap = await getDocs(
          query(messagesRef, orderBy("createdAt", "desc"), limit(MESSAGE_PAGE_SIZE))
        )
        const docs = initialSnap.docs
        setOldestDoc(docs[docs.length - 1] || null)
        setHasMore(docs.length === MESSAGE_PAGE_SIZE)
        const initialMessages = docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
        setMessages(initialMessages)
        setLoadingMessages(false)
        initialLoadedRef.current = true
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

        // live listener for latest window
        const liveQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(MESSAGE_PAGE_SIZE))
        unsubscribe = onSnapshot(liveQuery, (snapshot) => {
          const incoming = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          // merge and sort chronologically
          setMessages((prev) => {
            const map = new Map()
            prev.forEach((m) => map.set(m.id, m))
            incoming.forEach((m) => map.set(m.id, m))
            return Array.from(map.values()).sort((a, b) => {
              const aTime = a.createdAt?.seconds || 0
              const bTime = b.createdAt?.seconds || 0
              return aTime - bTime
            })
          })
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
  }, [appId, user, messagesRef])

  async function loadOlder() {
    if (!messagesRef || !hasMore || olderLoading || !oldestDoc) return
    setOlderLoading(true)
    try {
      const olderSnap = await getDocs(
        query(messagesRef, orderBy("createdAt", "desc"), startAfter(oldestDoc), limit(MESSAGE_PAGE_SIZE))
      )
      const docs = olderSnap.docs
      if (docs.length === 0) {
        setHasMore(false)
        return
      }
      setOldestDoc(docs[docs.length - 1] || null)
      if (docs.length < MESSAGE_PAGE_SIZE) setHasMore(false)
      const olderMessages = docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
      setMessages((prev) => {
        const map = new Map()
        olderMessages.concat(prev).forEach((m) => map.set(m.id, m))
        return Array.from(map.values()).sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return aTime - bTime
        })
      })
    } catch (err) {
      setError("Unable to load older messages.")
    } finally {
      setOlderLoading(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || !app) return
    try {
      await addDoc(messagesRef, {
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

  async function sendPayProposal(e) {
    e?.preventDefault()
    if (!app || !proposalAmount || Number(proposalAmount) <= 0) {
      setError("Please enter a valid pay amount above 0.")
      return
    }
    setProposalSubmitting(true)
    setError("")
    try {
      await addDoc(messagesRef, {
        applicationId: appId,
        applicantId: app.applicantId,
        employerId: app.employerId,
        type: "pay-proposal",
        amount: Number(proposalAmount),
        currency: proposalCurrency || jobCurrency || "IDR",
        status: "pending",
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
      setProposalOpen(false)
      setProposalAmount("")
    } catch (err) {
      setError("Unable to send proposal.")
    } finally {
      setProposalSubmitting(false)
    }
  }

  async function respondToProposal(messageId, status) {
    if (!["accepted", "rejected"].includes(status)) return
    setRespondingId(messageId)
    setError("")
    try {
      await updateDoc(doc(db, "applications", appId, "messages", messageId), {
        status,
        respondedBy: user.uid,
        respondedAt: serverTimestamp(),
      })
    } catch (err) {
      setError("Unable to update proposal. Please try again.")
    } finally {
      setRespondingId("")
    }
  }

  if (authLoading || !app) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        {error ? error : "Loading chat..."}
      </main>
    )
  }

  const pendingEmployerProposal = [...messages]
    .reverse()
    .find((m) => m.type === "pay-proposal" && m.status === "pending" && m.senderId === app.employerId)

  const acceptedProposal = [...messages]
    .reverse()
    .find((m) => m.type === "pay-proposal" && m.status === "accepted")

  const partialPay = [...messages].reverse().find((m) => m.type === "pay-partial")
  const partialReceived = [...messages].reverse().find((m) => m.type === "pay-partial-received")
  const delivered = [...messages].reverse().find((m) => m.type === "project-delivered")
  const fullPay = [...messages].reverse().find((m) => m.type === "pay-full")
  const chatCleared = messages.length === 0 && !loadingMessages

  const agreedCurrency = acceptedProposal?.currency || jobCurrency
  const agreedAmount = acceptedProposal?.amount || 0
  const partialAmount = Number((agreedAmount * 0.25).toFixed(2))
  const fullAmount = Number((agreedAmount * 0.75).toFixed(2))

  let stage = "partial-pay"
  if (projectEnded) stage = "ended"
  else if (partialPay && !partialReceived) stage = "partial-receipt"
  else if (partialReceived && !delivered) stage = "delivery"
  else if (delivered && !fullPay) stage = "full-pay"
  else if (fullPay) stage = "end"

  async function sendPartialPay() {
    if (!acceptedProposal || actionLoading || !messagesRef) return
    setActionLoading("partial-pay")
    setError("")
    try {
      await addDoc(messagesRef, {
        applicationId: appId,
        applicantId: app.applicantId,
        employerId: app.employerId,
        type: "pay-partial",
        amount: partialAmount,
        currency: agreedCurrency,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setError("Unable to record partial pay.")
    } finally {
      setActionLoading("")
    }
  }

  async function confirmPartialReceived() {
    if (!partialPay || actionLoading || !messagesRef) return
    setActionLoading("partial-received")
    setError("")
    try {
      await addDoc(messagesRef, {
        applicationId: appId,
        applicantId: app.applicantId,
        employerId: app.employerId,
        type: "pay-partial-received",
        amount: partialPay.amount,
        currency: partialPay.currency,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setError("Unable to confirm partial payment.")
    } finally {
      setActionLoading("")
    }
  }

  async function markDelivered() {
    if (!partialReceived || actionLoading || !messagesRef) return
    setActionLoading("delivered")
    setError("")
    try {
      await addDoc(messagesRef, {
        applicationId: appId,
        applicantId: app.applicantId,
        employerId: app.employerId,
        type: "project-delivered",
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setError("Unable to mark delivery.")
    } finally {
      setActionLoading("")
    }
  }

  async function sendFullPay() {
    if (!delivered || actionLoading || !messagesRef) return
    setActionLoading("full-pay")
    setError("")
    try {
      await addDoc(messagesRef, {
        applicationId: appId,
        applicantId: app.applicantId,
        employerId: app.employerId,
        type: "pay-full",
        amount: fullAmount,
        currency: agreedCurrency,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setError("Unable to record full pay.")
    } finally {
      setActionLoading("")
    }
  }

  async function endProjectPlaceholder() {
    if (!messagesRef || actionLoading) return
    setActionLoading("end-project")
    setError("")
    try {
      if (app?.id) {
        try {
          await updateDoc(doc(db, "applications", app.id), {
            status: "Completed",
            completedAt: serverTimestamp(),
            payout: { amount: agreedAmount, currency: agreedCurrency },
          })
        } catch {
          // continue even if application update fails
        }
      }
      if (app?.jobId) {
        try {
          await updateDoc(doc(db, "jobs", app.jobId), { status: "open" })
        } catch {
          // ignore reopen failures
        }
      }
      const snap = await getDocs(messagesRef)
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
      setMessages([])
      setHasMore(false)
      setOldestDoc(null)
      setProjectEnded(true)
      router.replace("/dashboard")
    } catch (err) {
      setError("Unable to clear chat.")
    } finally {
      setActionLoading("")
    }
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-6 space-y-4">
        <Link
          href={
            user.uid === app.employerId
              ? app.status === "Hired" || app.status === "Completed"
                ? "/dashboard/hires"
                : "/dashboard/applicants"
              : app.status === "Hired" || app.status === "Completed"
                ? "/dashboard/projects"
                : "/dashboard/approvals"
          }
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Chat about {app.jobTitle}</h1>
          <p className="text-sm text-gray-600">With {user.uid === app.employerId ? app.applicantName : app.employerName}</p>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="border rounded-2xl p-4 h-[60vh] overflow-y-auto space-y-3 bg-gray-50">
          {hasMore && (
            <button
              onClick={loadOlder}
              disabled={olderLoading}
              className="text-xs text-blue-600 underline"
            >
              {olderLoading ? "Loading earlier messages..." : "Load earlier messages"}
            </button>
          )}
          {loadingMessages && !initialLoadedRef.current && (
            <div className="text-sm text-gray-600">Loading messages...</div>
          )}
          {messages.map((m) => {
            const isMine = m.senderId === user.uid

            if (m.type === "pay-proposal") {
              const statusColors = {
                pending: "text-amber-700 bg-amber-50 border-amber-100",
                accepted: "text-green-700 bg-green-50 border-green-100",
                rejected: "text-red-700 bg-red-50 border-red-100",
              }
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl border px-4 py-3 text-sm bg-white ${isMine ? "ml-auto border-blue-100 bg-blue-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] opacity-80">{m.senderName}</div>
                    <span className={`text-[11px] px-2 py-1 rounded-full border ${statusColors[m.status] || "text-gray-600 bg-gray-100 border-gray-200"}`}>
                      {m.status === "pending" ? "Awaiting response" : m.status === "accepted" ? "Accepted" : "Rejected"}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-900 mt-1">
                    {formatCurrency({ amount: m.amount || 0, currency: m.currency || jobCurrency })}
                  </div>
                  <div className="text-xs text-gray-600">Proposed pay</div>

                  {m.status === "pending" && user.uid === app.applicantId && m.senderId === app.employerId && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => respondToProposal(m.id, "accepted")}
                        disabled={respondingId === m.id}
                        className="px-3 py-2 rounded bg-green-600 text-white text-xs disabled:opacity-70"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToProposal(m.id, "rejected")}
                        disabled={respondingId === m.id}
                        className="px-3 py-2 rounded border text-xs text-gray-700 hover:border-red-400 disabled:opacity-70"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {m.status !== "pending" && (
                    <div className="text-[11px] text-gray-500 mt-2">
                      Responded by {m.respondedBy === app.applicantId ? app.applicantName : app.employerName || "participant"}
                    </div>
                  )}
                </div>
              )
            }

            if (m.type === "pay-partial" || m.type === "pay-full") {
              const label = m.type === "pay-partial" ? "Partial pay (25%)" : "Final pay (75%)"
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl border px-4 py-3 text-sm bg-white ${isMine ? "ml-auto border-blue-100 bg-blue-50" : ""}`}
                >
                  <div className="text-[11px] opacity-80">{m.senderName}</div>
                  <div className="font-semibold text-gray-900 mt-1">
                    {formatCurrency({ amount: m.amount || 0, currency: m.currency || jobCurrency })}
                  </div>
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              )
            }

            if (m.type === "pay-partial-received") {
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl border px-4 py-3 text-sm bg-white ${isMine ? "ml-auto border-blue-100 bg-blue-50" : ""}`}
                >
                  <div className="text-[11px] opacity-80">{m.senderName}</div>
                  <div className="font-semibold text-gray-900 mt-1">
                    Partial payment received
                  </div>
                </div>
              )
            }

            if (m.type === "project-delivered") {
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl border px-4 py-3 text-sm bg-white ${isMine ? "ml-auto border-blue-100 bg-blue-50" : ""}`}
                >
                  <div className="text-[11px] opacity-80">{m.senderName}</div>
                  <div className="font-semibold text-gray-900 mt-1">Project delivered</div>
                  <div className="text-xs text-gray-600">Waiting for employer confirmation and full pay</div>
                </div>
              )
            }

            return (
              <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${isMine ? "ml-auto bg-blue-600 text-white" : "bg-white border"}`}>
                <div className="text-[11px] opacity-80">{m.senderName}</div>
                <div>{m.text}</div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {app.status === "Hired" && user.uid === app.employerId && !acceptedProposal && (
          <div className="border rounded-xl p-4 bg-white flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Agree on payment</div>
              <div className="text-xs text-gray-600">
                {pendingEmployerProposal
                  ? `Awaiting student response to ${formatCurrency({
                      amount: pendingEmployerProposal.amount || 0,
                      currency: pendingEmployerProposal.currency || jobCurrency,
                    })}`
                  : "Propose a fixed amount for this engagement once you both agree on the hire."}
              </div>
            </div>
            <button
              onClick={() => setProposalOpen(true)}
              disabled={Boolean(pendingEmployerProposal)}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
            >
              Propose pay
            </button>
          </div>
        )}

        {acceptedProposal && (
          <div className="border rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Payment progress</div>
                <div className="text-xs text-gray-600">
                  Agreed price: {formatCurrency({ amount: agreedAmount, currency: agreedCurrency })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {stage === "partial-pay" && (
                <>
                  <div className="text-xs text-gray-600">
                    Employer sends 25% upfront before work starts.
                  </div>
                  {user.uid === app.employerId ? (
                    <button
                      onClick={sendPartialPay}
                      disabled={Boolean(partialPay) || actionLoading === "partial-pay"}
                      className="border rounded-lg px-4 py-3 text-left text-sm disabled:opacity-60"
                    >
                      <div className="font-semibold text-gray-900">Send 25% partial pay</div>
                      <div className="text-xs text-gray-600">
                        {partialPay
                          ? `Sent (${formatCurrency({ amount: partialPay.amount || partialAmount, currency: agreedCurrency })})`
                          : `Pay ${formatCurrency({ amount: partialAmount, currency: agreedCurrency })}`}
                      </div>
                    </button>
                  ) : (
                    <div className="border rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50">
                      Waiting for employer to send partial pay.
                    </div>
                  )}
                </>
              )}

              {stage === "partial-receipt" && (
                <>
                  <div className="text-xs text-gray-600">Student confirms funds arrived.</div>
                  {user.uid === app.applicantId ? (
                    <button
                      onClick={confirmPartialReceived}
                      disabled={!partialPay || Boolean(partialReceived) || actionLoading === "partial-received"}
                      className="border rounded-lg px-4 py-3 text-left text-sm disabled:opacity-60"
                    >
                      <div className="font-semibold text-gray-900">I’ve received the partial payment</div>
                      <div className="text-xs text-gray-600">
                        {partialReceived ? "Confirmed" : "Confirm once funds arrive"}
                      </div>
                    </button>
                  ) : (
                    <div className="border rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50">
                      Partial pay sent. Waiting for student confirmation.
                    </div>
                  )}
                </>
              )}

              {stage === "delivery" && (
                <>
                  <div className="text-xs text-gray-600">Student delivers the project after partial receipt.</div>
                  {user.uid === app.applicantId ? (
                    <button
                      onClick={markDelivered}
                      disabled={!partialReceived || Boolean(delivered) || actionLoading === "delivered"}
                      className="border rounded-lg px-4 py-3 text-left text-sm disabled:opacity-60"
                    >
                      <div className="font-semibold text-gray-900">Project delivered</div>
                      <div className="text-xs text-gray-600">
                        {delivered ? "Marked delivered" : "Mark when you’ve shared the work"}
                      </div>
                    </button>
                  ) : (
                    <div className="border rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50">
                      Student is working. Waiting for delivery.
                    </div>
                  )}
                </>
              )}

              {stage === "full-pay" && (
                <>
                  <div className="text-xs text-gray-600">Employer confirms delivery and pays the remaining 75%.</div>
                  {user.uid === app.employerId ? (
                    <button
                      onClick={sendFullPay}
                      disabled={!delivered || Boolean(fullPay) || actionLoading === "full-pay"}
                      className="border rounded-lg px-4 py-3 text-left text-sm disabled:opacity-60"
                    >
                      <div className="font-semibold text-gray-900">Confirm delivery and full pay</div>
                      <div className="text-xs text-gray-600">
                        {fullPay
                          ? `Sent (${formatCurrency({ amount: fullPay.amount || fullAmount, currency: agreedCurrency })})`
                          : `Pay ${formatCurrency({ amount: fullAmount, currency: agreedCurrency })}`}
                      </div>
                    </button>
                  ) : (
                    <div className="border rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50">
                      Waiting for employer to send remaining payment.
                    </div>
                  )}
                </>
              )}

              {stage === "end" && (
                <>
                  <div className="text-xs text-gray-600">Final payment done. Student can end the project.</div>
                  {user.uid === app.applicantId ? (
                    <button
                      onClick={endProjectPlaceholder}
                      disabled={actionLoading === "end-project"}
                      className="border rounded-lg px-4 py-3 text-left text-sm disabled:opacity-60"
                    >
                      <div className="font-semibold text-gray-900">End project</div>
                      <div className="text-xs text-gray-600">Finalize the project (not yet wired)</div>
                    </button>
                  ) : (
                    <div className="border rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50">
                      Final payment sent. Student will close the project.
                    </div>
                  )}
                </>
              )}

              {stage === "ended" && (
                <div className="border rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50">
                  Project closed. Chat history has been cleared.
                </div>
              )}
            </div>
          </div>
        )}

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

      {proposalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <div className="text-lg font-semibold">Propose fixed pay</div>
            <p className="text-sm text-gray-600">
              Share the final amount you agree to pay the student for this project.
            </p>
            <form onSubmit={sendPayProposal} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={proposalCurrency}
                  onChange={(e) => setProposalCurrency(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                  required
                >
                  <option value="IDR">IDR</option>
                  <option value="SGD">SGD</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(e.target.value)}
                  className="col-span-2 border rounded-lg px-3 py-2"
                  placeholder="Agreed pay"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProposalOpen(false)}
                  className="px-3 py-2 rounded border text-sm"
                  disabled={proposalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-70"
                  disabled={proposalSubmitting}
                >
                  Send proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
