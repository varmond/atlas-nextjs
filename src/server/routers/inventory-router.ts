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
})
