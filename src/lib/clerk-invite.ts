import { clerkClient } from "@clerk/nextjs/server"

function appBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  }
  return "http://localhost:3000"
}

/**
 * Sends a Clerk invitation email so the user can set a password and sign in.
 * Requires "Sign-up mode: Restricted" (invitation-only) in Clerk for a fully closed public signup.
 */
export async function sendClerkInvitation(emailAddress: string) {
  const client = await clerkClient()
  const base = appBaseUrl()
  return client.invitations.createInvitation({
    emailAddress: emailAddress.trim().toLowerCase(),
    redirectUrl: `${base}/welcome`,
    notify: true,
    ignoreExisting: true,
  })
}
