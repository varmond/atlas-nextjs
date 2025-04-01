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
  getInventory: privateProcedure.query(async ({ c, ctx }) => {
    const inventoryItems = await db.inventory.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
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
})
