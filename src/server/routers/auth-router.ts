import { currentUser } from "@clerk/nextjs/server"
import { router } from "../__internals/router"
import { publicProcedure } from "../procedures"
import { db } from "@/db"

export const authRouter = router({
  getDatabaseSyncStatus: publicProcedure.query(async ({ c }) => {
    const auth = await currentUser()

    if (!auth) {
      return c.json({ isSynced: false })
    }

    const user = await db.user.findFirst({ 
      where: { externalId: auth.id },
      include: {
        userOrganizations: {
          include: {
            organization: true
          }
        }
      }
    })

    if (!user) {
      // Create organization first
      const organization = await db.organization.create({
        data: {
          name: `${auth.firstName}'s Organization`,
          subscriptionStatus: 'ACTIVE',
          planType: 'FREE',
        },
      })

      // Create user
      const newUser = await db.user.create({
        data: {
          quotaLimit: 100,
          externalId: auth.id,
          email: auth.emailAddresses[0].emailAddress,
          currentOrganizationId: organization.id, // Set as current organization
          role: 'OWNER',
        },
      })

      // Create UserOrganization record
      await db.userOrganization.create({
        data: {
          userId: newUser.id,
          organizationId: organization.id,
          role: 'OWNER',
          isActive: true,
        }
      })

      return c.json({ isSynced: true })
    }

    // If user exists but has no current organization, set one
    if (!user.currentOrganizationId && user.userOrganizations.length > 0) {
      await db.user.update({
        where: { id: user.id },
        data: { 
          currentOrganizationId: user.userOrganizations[0].organizationId 
        }
      })
    }

    return c.json({ isSynced: true })
  }),
})

//reg
// export const GET = (req: Request) => {
//   return new Response(JSON.stringify({ status: "success" }))
// }
