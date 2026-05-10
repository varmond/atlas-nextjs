#!/usr/bin/env tsx

/**
 * Grant isSuperAdmin for /dashboard/admin and /api/admin/*
 *
 * Prefer running with npx so the email argument is never dropped:
 *   npx tsx scripts/make-super-admin.ts <email>
 *   npx tsx scripts/make-super-admin.ts --create <email>   # creates User row if missing (bootstrap)
 *
 * With npm you must use -- before the email:
 *   npm run make-super-admin -- <email>
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function parseArgs() {
  const raw = process.argv.slice(2)
  const create = raw.includes("--create")
  const rest = raw.filter((a) => a !== "--create")
  const email = rest.join(" ").trim()
  return { email, create }
}

async function findUserByEmail(email: string) {
  const trimmed = email.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase()

  let user = await prisma.user.findUnique({
    where: { email: normalized },
  })
  if (user) return user

  user = await prisma.user.findFirst({
    where: {
      email: { equals: trimmed, mode: "insensitive" },
    },
  })
  return user
}

const randomApiKey = () =>
  `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`

async function makeSuperAdmin(email: string, createIfMissing: boolean) {
  console.log(`Making super admin: ${email}`)

  try {
    let user = await findUserByEmail(email)

    if (!user && createIfMissing) {
      const normalized = email.trim().toLowerCase()
      user = await prisma.user.create({
        data: {
          email: normalized,
          quotaLimit: 100,
          plan: "FREE",
          isSuperAdmin: true,
          apiKey: randomApiKey(),
        },
      })
      console.log(`Created User row for ${normalized} (super admin).`)
      console.log(
        "Sign in with Clerk using this exact email so /welcome can link externalId."
      )
      return
    }

    if (!user) {
      console.error(`No User with email matching: ${email}`)
      console.log("")
      console.log("Fix options:")
      console.log(
        "  1. Sign in once with Clerk (after invite) so your User row exists, then rerun."
      )
      console.log(
        "  2. Bootstrap: npx tsx scripts/make-super-admin.ts --create <same-email-as-clerk>"
      )
      console.log("")
      console.log("Users in database:")
      const allUsers = await prisma.user.findMany({
        select: { email: true, isSuperAdmin: true },
        orderBy: { email: "asc" },
      })
      if (allUsers.length === 0) {
        console.log("  (none)")
      } else {
        allUsers.forEach((u) => {
          console.log(`  ${u.email}${u.isSuperAdmin ? " (already super admin)" : ""}`)
        })
      }
      return
    }

    console.log(`Found user: ${user.email}`)
    console.log(`  isSuperAdmin: ${user.isSuperAdmin ? "yes" : "no"}`)

    if (user.isSuperAdmin) {
      console.log("Already a super admin. Open /dashboard/admin while signed in.")
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true },
    })

    console.log("")
    console.log("Done. Open /dashboard/admin (you must be signed in as this Clerk user).")
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const { email, create } = parseArgs()

  if (!email || !email.includes("@")) {
    console.log(`
Usage:
  npx tsx scripts/make-super-admin.ts <email>
  npx tsx scripts/make-super-admin.ts --create <email>

npm (note the -- before the email):
  npm run make-super-admin -- <email>
  npm run make-super-admin -- --create <email>

Creates or updates User.isSuperAdmin for the internal admin dashboard.
`)
    process.exit(1)
  }

  await makeSuperAdmin(email, create)
}

main().catch(console.error)
