import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

export const transferRouter = router({
  getTransfers: privateProcedure.query(async ({ c, ctx }) => {
    try {
      const transfers = await db.inventoryTransfer.findMany({
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
            }
          },
          sourceLocation: {
            select: {
              name: true,
            }
          },
          destLocation: {
            select: {
              name: true,
            }
          },
          sourceSubLocation: {
            select: {
              name: true,
            }
          },
          destSubLocation: {
            select: {
              name: true,
            }
          },
          user: {
            select: {
              email: true,
            }
          },
        },
        orderBy: { 
          createdAt: "desc" 
        },
      })
      return c.json({ transfers })
    } catch (error) {
      console.error("Error fetching transfers:", error)
      throw new HTTPException(500, { message: "Failed to fetch transfers" })
    }
  }),

  createTransfer: privateProcedure
    .input(z.object({
      sourceLocationId: z.string(),
      sourceSubLocationId: z.string().optional(),
      destLocationId: z.string(),
      destSubLocationId: z.string().optional(),
      inventoryId: z.string(),
      quantity: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        // Check if source has enough quantity
        const sourceInventory = await db.inventory.findFirst({
          where: {
            id: input.inventoryId,
            organizationId: ctx.user.organizationId ?? "",
          }
        })

        if (!sourceInventory) {
          throw new HTTPException(404, { message: "Source inventory not found" })
        }

        if (sourceInventory.unitsReceived < input.quantity) {
          throw new HTTPException(400, { message: "Insufficient quantity in source location" })
        }

        // Start transaction
        const [updatedSource, transfer] = await db.$transaction([
          // Update source inventory
          db.inventory.update({
            where: { id: input.inventoryId },
            data: { 
              unitsReceived: sourceInventory.unitsReceived - input.quantity 
            }
          }),
          // Create transfer record
          db.inventoryTransfer.create({
            data: {
              quantity: input.quantity,
              sourceLocationId: input.sourceLocationId,
              sourceSubLocationId: input.sourceSubLocationId,
              destLocationId: input.destLocationId,
              destSubLocationId: input.destSubLocationId,
              inventoryId: input.inventoryId,
              notes: input.notes,
              userId: ctx.user.id,
              organizationId: ctx.user.organizationId ?? "",
            }
          })
        ])

        return c.json({ success: true, transfer })
      } catch (error) {
        console.error("Error creating transfer:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to create transfer" })
      }
    }),
})
