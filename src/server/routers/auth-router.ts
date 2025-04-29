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

    const user = await db.user.findFirst({ where: { externalId: auth.id } })

    if (!user) {
      // Create organization first
      const organization = await db.organization.create({
        data: {
          name: `${auth.firstName}'s Organization`,
          subscriptionStatus: 'ACTIVE',
          planType: 'FREE',
        },
      })

      // Then create user with organization
      await db.user.create({
        data: {
          quotaLimit: 100,
          externalId: auth.id,
          email: auth.emailAddresses[0].emailAddress,
          organizationId: organization.id,
          role: 'OWNER',
        },
      })

      return c.json({ isSynced: true })
    }

    return c.json({ isSynced: true })
  }),
})

//reg
// export const GET = (req: Request) => {
//   return new Response(JSON.stringify({ status: "success" }))
// }
