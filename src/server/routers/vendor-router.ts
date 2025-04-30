import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const vendorRouter = router({
  getVendors: privateProcedure.query(async ({ c, ctx }) => {
    try {
      const vendors = await db.vendor.findMany({
        where: { 
          organizationId: ctx.user.organizationId ?? "" 
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      })
      
      return c.json({ vendors })
    } catch (error) {
      console.error('Error fetching vendors:', error)
      throw new HTTPException(500, { message: "Failed to fetch vendors" })
    }
  }),

  createVendor: privateProcedure
    .input(vendorSchema)
    .mutation(async ({ c, ctx, input }) => {
      const vendor = await db.vendor.create({
        data: {
          ...input,
          organizationId: ctx.user.organizationId ?? "",
        },
      })
      return c.json({ vendor })
    }),
}) 