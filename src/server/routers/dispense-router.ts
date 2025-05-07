import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

export const dispenseRouter = router({
  getDispenses: privateProcedure.query(async ({ c, ctx }) => {
    try {
      const dispenses = await db.inventoryDispense.findMany({
        where: { 
          organizationId: ctx.user.organizationId ?? "" 
        },
        include: {
          inventory: {
            include: {
              product: {
                select: {
                  name: true,
                }
              },
              Location: {
                select: {
                  name: true,
                }
              },
              subLocation: {
                select: {
                  name: true,
                }
              },
            }
          },
          user: {
            select: {
              email: true,
            }
          },
        },
        orderBy: { 
          dispensedAt: "desc" 
        },
      })
      return c.json({ dispenses })
    } catch (error) {
      console.error("Error fetching dispenses:", error)
      throw new HTTPException(500, { message: "Failed to fetch dispenses" })
    }
  }),

  createDispense: privateProcedure
    .input(z.object({
      inventoryId: z.string(),
      quantity: z.number().positive(),
      note: z.string().optional(),
      dispensedAt: z.string().optional(), // For retroactive entries
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        const inventory = await db.inventory.findFirst({
          where: { 
            id: input.inventoryId,
            organizationId: ctx.user.organizationId ?? "",
          }
        })

        if (!inventory) {
          throw new HTTPException(404, { message: "Inventory not found" })
        }

        if (inventory.unitsReceived < input.quantity) {
          throw new HTTPException(400, { message: "Insufficient quantity" })
        }

        const [updated, dispense] = await db.$transaction([
          db.inventory.update({
            where: { id: input.inventoryId },
            data: { 
              unitsReceived: inventory.unitsReceived - input.quantity 
            }
          }),
          db.inventoryDispense.create({
            data: {
              inventoryId: input.inventoryId,
              quantity: input.quantity,
              note: input.note,
              dispensedAt: input.dispensedAt ? new Date(input.dispensedAt) : new Date(),
              userId: ctx.user.id,
              organizationId: ctx.user.organizationId ?? "",
            }
          })
        ])

        return c.json({ success: true, dispense })
      } catch (error) {
        console.error("Error dispensing inventory:", error)
        throw new HTTPException(500, { message: "Failed to dispense inventory" })
      }
    }),
}) 