import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

// Schema validation
const inventoryCreateSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  price: z.coerce.number().positive("Price must be positive"),
  packageCost: z.coerce.number().positive("Package cost must be positive"),
  lotNumber: z.string().min(1, "Lot number is required"),
  expirationDate: z.string(), // Will be parsed as Date in the handler
  serialNumber: z.string().min(1, "Serial number is required"),
  vendor: z.string().min(1, "Vendor is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  unitsReceived: z.coerce.number().int().positive("Units must be positive"),
})

export const inventoryRouter = router({
  getInventory: privateProcedure
    .input(z.object({
      productId: z.string().optional(),
      locationId: z.string().optional(),
    }))
    .query(async ({ c, ctx, input }) => {
      const inventoryItems = await db.inventory.findMany({
        where: {
          organizationId: ctx.user.organizationId ?? "",
          productId: input.productId,
          locationId: input.locationId,
          unitsReceived: {
            gt: 0
          }
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return c.json({ inventoryItems })
    }),

  getProducts: privateProcedure.query(async ({ c, ctx }) => {
    const products = await db.products.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
      select: {
        id: true,
        name: true,
        sku: true,
      },
      orderBy: { name: "asc" },
    })

    return c.json({ products })
  }),

  createInventory: privateProcedure
    .input(inventoryCreateSchema)
    .mutation(async ({ c, input, ctx }) => {
      try {
        const {
          productId,
          price,
          packageCost,
          lotNumber,
          expirationDate,
          serialNumber,
          vendor,
          manufacturer,
          unitsReceived,
        } = input

        // Check if product exists
        const product = await db.products.findUnique({
          where: {
            id: productId,
            organizationId: ctx.user.organizationId ?? "",
          },
        })

        if (!product) {
          throw new HTTPException(404, { message: "Product not found" })
        }

        // Create inventory header first
        const inventoryHeader = await db.inventoryHeader.create({
          data: {
            vendor,
            manufacturer,
            packageCost,
            receiptNumber: `R-${Date.now()}`, // Generate a receipt number
            userId: ctx.user.id,
            organizationId: ctx.user.organizationId ?? "",
          },
        })

        // Then create inventory item with reference to the header
        const inventory = await db.inventory.create({
          data: {
            productId,
            price,
            packageCost,
            lotNumber,
            expirationDate: new Date(expirationDate),
            serialNumber,
            vendor,
            manufacturer,
            unitsReceived,
            userId: ctx.user.id,
            organizationId: ctx.user.organizationId ?? "",
            headerId: inventoryHeader.id,
          },
        })

        return c.json({ success: true, inventory, inventoryHeader })
      } catch (error) {
        console.error("Error creating inventory:", error)
        throw new HTTPException(500, {
          message: "Failed to create inventory",
        })
      }
    }),

  getInventoryById: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ c, input, ctx }) => {
      const { id } = input

      const inventory = await db.inventory.findUnique({
        where: {
          id,
          organizationId: ctx.user.organizationId ?? "",
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      })

      if (!inventory) {
        throw new HTTPException(404, { message: "Inventory item not found" })
      }

      return c.json({ inventory })
    }),

  getLocations: privateProcedure.query(async ({ c, ctx }) => {
    const locations = await db.location.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    return c.json({ locations })
  }),

  createBatchInventory: privateProcedure
    .input(
      z.object({
        header: z.object({
          vendor: z.string().optional(),
          manufacturer: z.string().optional(),
          packageCost: z.coerce.number().min(0),
          receiptDate: z.string(),
          receiptNumber: z.string().optional(),
          notes: z.string().optional(),
          locationId: z.string().min(1),
        }),
        items: z.array(
          z.object({
            productId: z.string().min(1),
            price: z.coerce.number().positive(),
            lotNumber: z.string().min(1),
            expirationDate: z.string(),
            serialNumber: z.string().min(1),
            unitsReceived: z.coerce.number().int().positive(),
          })
        ),
      })
    )
    .mutation(async ({ c, input, ctx }) => {
      try {
        const { header, items } = input

        // Create inventory header
        const inventoryHeader = await db.inventoryHeader.create({
          data: {
            vendor: header.vendor ?? "",
            manufacturer: header.manufacturer ?? "",
            receiptNumber: header.receiptNumber || `R-${Date.now()}`,
            notes: header.notes,
            packageCost: header.packageCost,
            receiptDate: new Date(header.receiptDate),
            userId: ctx.user.id,
            organizationId: ctx.user.organizationId ?? "",
            locationId: header.locationId,
          },
        })

        // Create inventory items
        const inventoryItems = await Promise.all(
          items.map((item) =>
            db.inventory.create({
              data: {
                price: item.price,
                packageCost: header.packageCost, // Using the header's package cost
                lotNumber: item.lotNumber,
                expirationDate: new Date(item.expirationDate),
                serialNumber: item.serialNumber,
                vendor: header.vendor ?? "", // Using the header's vendor
                manufacturer: header.manufacturer ?? "", // Using the header's manufacturer
                unitsReceived: item.unitsReceived,
                userId: ctx.user.id,
                organizationId: ctx.user.organizationId ?? "",
                headerId: inventoryHeader.id,
                productId: item.productId,
                locationId: header.locationId,
              },
            })
          )
        )

        return c.json({
          success: true,
          inventoryHeader,
          itemsCount: inventoryItems.length,
        })
      } catch (error) {
        console.error("Error creating batch inventory:", error)
        throw new HTTPException(500, {
          message: "Failed to create batch inventory",
        })
      }
    }),

  createTransfer: privateProcedure
    .input(z.object({
      inventoryId: z.string(),
      quantity: z.number().int().positive(),
      sourceLocationId: z.string(),
      sourceSubLocationId: z.string().optional(),
      destLocationId: z.string(),
      destSubLocationId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        // Start transaction
        return await db.$transaction(async (tx) => {
          // Check if source has enough quantity
          const sourceInventory = await tx.inventory.findFirst({
            where: {
              id: input.inventoryId,
              locationId: input.sourceLocationId,
              organizationId: ctx.user.organizationId ?? "",
              ...(input.sourceSubLocationId && {
                subLocationId: input.sourceSubLocationId
              })
            },
          })

          if (!sourceInventory || sourceInventory.unitsReceived < input.quantity) {
            throw new HTTPException(400, { message: "Insufficient quantity available" })
          }

          // Create transfer record
          const transfer = await tx.inventoryTransfer.create({
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
            },
          })

          // Update source inventory
          await tx.inventory.update({
            where: { id: input.inventoryId },
            data: {
              unitsReceived: sourceInventory.unitsReceived - input.quantity,
            },
          })

          // Create or update destination inventory
          const destInventory = await tx.inventory.findFirst({
            where: {
              productId: sourceInventory.productId,
              locationId: input.destLocationId,
              organizationId: ctx.user.organizationId ?? "",
              ...(input.destSubLocationId && {
                subLocationId: input.destSubLocationId
              })
            },
          })

          if (destInventory) {
            await tx.inventory.update({
              where: { id: destInventory.id },
              data: {
                unitsReceived: destInventory.unitsReceived + input.quantity,
              },
            })
          } else {
            await tx.inventory.create({
              data: {
                productId: sourceInventory.productId,
                price: sourceInventory.price,
                packageCost: sourceInventory.packageCost,
                lotNumber: sourceInventory.lotNumber,
                expirationDate: sourceInventory.expirationDate,
                serialNumber: sourceInventory.serialNumber,
                vendor: sourceInventory.vendor,
                manufacturer: sourceInventory.manufacturer,
                unitsReceived: input.quantity,
                locationId: input.destLocationId,
                ...(input.destSubLocationId && {
                  subLocationId: input.destSubLocationId
                }),
                organizationId: ctx.user.organizationId ?? "",
                userId: ctx.user.id,
                headerId: sourceInventory.headerId,
              },
            })
          }

          return c.json({ success: true, transfer })
        })
      } catch (error) {
        console.error("Error creating transfer:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to create transfer" })
      }
    }),
})
