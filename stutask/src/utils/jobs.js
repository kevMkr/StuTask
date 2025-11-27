export function formatCurrency({ amount = 0, currency = "USD" }) {
  const code = currency || "USD"
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount || 0)
  } catch {
    return `${code} ${amount || 0}`
  }
}

export function formatDate(iso) {
  if (!iso) return ""
  const date = typeof iso === "string" ? new Date(iso) : iso?.toDate?.() ? iso.toDate() : new Date()
  return date.toISOString().slice(0, 10)
}
