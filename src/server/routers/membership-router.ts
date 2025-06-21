import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

export const membershipRouter = router({
  createTier: privateProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      frequency: z.enum(["MONTHLY", "ANNUALLY"]),
      benefits: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        benefitType: z.enum(["DISCOUNT_PERCENTAGE", "DISCOUNT_FIXED", "FREE_PRODUCT", "FREE_SERVICE"]),
        value: z.number(),
        productId: z.string().optional(),
      })),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        const tier = await db.membershipTier.create({
          data: {
            name: input.name,
            description: input.description,
            price: input.price,
            frequency: input.frequency,
            organizationId: ctx.user.organizationId ?? "",
            benefits: {
              create: input.benefits,
            },
          },
          include: {
            benefits: true,
          },
        })

        return c.json({ success: true, tier })
      } catch (error) {
        console.error("Error creating membership tier:", error)
        throw new HTTPException(500, { message: "Failed to create membership tier" })
      }
    }),

  getTiers: privateProcedure.query(async ({ c, ctx }) => {
    try {
      const tiers = await db.membershipTier.findMany({
        where: { 
          organizationId: ctx.user.organizationId ?? "" 
        },
        include: {
          benefits: true,
          _count: {
            select: {
              subscriptions: {
                where: { status: "ACTIVE" }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
      return c.json({ tiers })
    } catch (error) {
      console.error("Error fetching membership tiers:", error)
      throw new HTTPException(500, { message: "Failed to fetch membership tiers" })
    }
  }),
}) 