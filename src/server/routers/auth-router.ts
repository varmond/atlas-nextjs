import { currentUser } from "@clerk/nextjs/server"
import { router } from "../__internals/router"
import { publicProcedure } from "../procedures"
import { db } from "@/db"
import { normalizeEmail } from "@/lib/pending-user"

function primaryEmail(
  auth: NonNullable<Awaited<ReturnType<typeof currentUser>>>
) {
  const list = auth.emailAddresses ?? []
  const primary = list.find((e) => e.id === auth.primaryEmailAddressId)
  return (primary ?? list[0])?.emailAddress?.trim() ?? null
}

export const authRouter = router({
  getDatabaseSyncStatus: publicProcedure.query(async ({ c }) => {
    const auth = await currentUser()

    if (!auth) {
      return c.json({ isSynced: false as const })
    }

    const email = primaryEmail(auth)
    if (!email) {
      return c.json({
        isSynced: false as const,
        needsInvitation: true as const,
        reason: "no_email" as const,
      })
    }

    const normalizedEmail = normalizeEmail(email)

    let user = await db.user.findFirst({
      where: { externalId: auth.id },
      include: {
        userOrganizations: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!user) {
      const pending = await db.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
        include: {
          userOrganizations: {
            include: {
              organization: true,
            },
          },
        },
      })

      if (!pending) {
        return c.json({
          isSynced: false as const,
          needsInvitation: true as const,
          reason: "not_provisioned" as const,
        })
      }

      if (pending.externalId != null && pending.externalId !== auth.id) {
        return c.json({
          isSynced: false as const,
          needsInvitation: false as const,
          error: "account_mismatch" as const,
        })
      }

      user = await db.user.update({
        where: { id: pending.id },
        data: { externalId: auth.id },
        include: {
          userOrganizations: {
            include: {
              organization: true,
            },
          },
        },
      })
    } else {
      // Email changed in Clerk — keep DB email in sync for admin lists
      if (user.email.toLowerCase() !== normalizedEmail) {
        const emailTaken = await db.user.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            NOT: { id: user.id },
          },
        })
        if (!emailTaken) {
          user = await db.user.update({
            where: { id: user.id },
            data: { email: normalizedEmail },
            include: {
              userOrganizations: {
                include: {
                  organization: true,
                },
              },
            },
          })
        }
      }
    }

    if (user.userOrganizations.length === 0) {
      return c.json({
        isSynced: false as const,
        needsInvitation: true as const,
        reason: "no_practice" as const,
      })
    }

    if (!user.currentOrganizationId) {
      const firstOrgId = user.userOrganizations[0]!.organizationId
      await db.user.update({
        where: { id: user.id },
        data: {
          currentOrganizationId: firstOrgId,
          organizationId: user.organizationId ?? firstOrgId,
        },
      })
    }

    return c.json({ isSynced: true as const })
  }),
})
