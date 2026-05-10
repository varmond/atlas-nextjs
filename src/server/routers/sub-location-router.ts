import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { requireActiveOrganizationId } from "@/lib/active-organization"

export const subLocationRouter = router({
  getSubLocations: privateProcedure
    .input(z.object({
      locationId: z.string(),
    }))
    .query(async ({ c, input, ctx }) => {
      const organizationId = requireActiveOrganizationId(ctx.user)
      const subLocations = await db.subLocation.findMany({
        where: {
          locationId: input.locationId,
          organizationId,
        },
        orderBy: { name: "asc" },
      })
      return c.json({ subLocations })
    }),

  createSubLocation: privateProcedure
    .input(z.object({
      locationId: z.string(),
      name: z.string().min(1, "Name is required"),
      code: z.string().min(1, "Code is required"),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        const organizationId = requireActiveOrganizationId(ctx.user)
        const subLocation = await db.subLocation.create({
          data: {
            name: input.name,
            code: input.code,
            locationId: input.locationId,
            organizationId,
          },
        })
        return c.json({ success: true, subLocation })
      } catch (error) {
        console.error("Error creating sub-location:", error)
        throw new HTTPException(500, { message: "Failed to create sub-location" })
      }
    }),
}) 