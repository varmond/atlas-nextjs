import { db } from "@/db"

const randomApiKey = () =>
  `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`

/** Normalize email for unique lookups (must match auth sync). */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/**
 * Create a DB row for an invited user who has not signed in with Clerk yet (no externalId).
 */
export async function createPendingUserRecord(email: string) {
  const normalized = normalizeEmail(email)
  return db.user.create({
    data: {
      email: normalized,
      quotaLimit: 100,
      plan: "FREE",
      isSuperAdmin: false,
      apiKey: randomApiKey(),
    },
  })
}

export async function findOrCreatePendingUserByEmail(email: string) {
  const normalized = normalizeEmail(email)
  const existing = await db.user.findUnique({ where: { email: normalized } })
  if (existing) return existing
  return createPendingUserRecord(normalized)
}
