import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

export const locationRouter = router({
  getLocations: privateProcedure.query(async ({ c, ctx }) => {
    const locations = await db.location.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    })
    return c.json({ locations })
  }),

  createLocation: privateProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        const location = await db.location.create({
          data: {
            name: input.name,
            description: input.description,
            isActive: true,
            organizationId: ctx.user.organizationId ?? "",
            userId: ctx.user.id,
          },
        })
        return c.json({ success: true, location })
      } catch (error) {
        console.error("Error creating location:", error)
        throw new HTTPException(500, { message: "Failed to create location" })
      }
    }),

  updateLocation: privateProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        const location = await db.location.update({
          where: {
            id: input.id,
            organizationId: ctx.user.organizationId ?? "",
          },
          data: {
            name: input.name,
            description: input.description,
            isActive: input.isActive,
          },
        })
        return c.json({ success: true, location })
      } catch (error) {
        console.error("Error updating location:", error)
        throw new HTTPException(500, { message: "Failed to update location" })
      }
    }),

  getLocation: privateProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ c, input, ctx }) => {
      const location = await db.location.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.user.organizationId ?? "",
        },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
      })

      if (!location) {
        throw new HTTPException(404, { message: "Location not found" })
      }

      return c.json({ location })
    }),
}) 