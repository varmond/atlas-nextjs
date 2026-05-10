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
  lotNumber: z.string().optional(),
  expirationDate: z.string().optional().nullable(), // Will be parsed as Date in the handler
  serialNumber: z.string().optional(),
  vendor: z.string().optional(),
  manufacturer: z.string().optional(),
  unitsReceived: z.coerce.number().int().positive("Units must be positive"),
  locationId: z.string().min(1, "Location is required"),
  subLocationId: z.string().optional(),
  notes: z.string().optional(),
})

export const inventoryRouter = router({
  getInventoryItemById: privateProcedure
    .input(z.object({
      id: z.string().min(1, "Inventory item ID is required"),
    }))
    .query(async ({ c, ctx, input }) => {
      try {
        const organizationId = ctx.user.currentOrganizationId || ctx.user.organizationId
        if (!organizationId) {
          throw new HTTPException(400, {
            message: "User does not belong to an organization",
          })
        }

        const inventoryItem = await db.inventory.findFirst({
          where: {
            id: input.id,
            organizationId: organizationId,
          },
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                type: true,
              },
            },
            Location: {
              select: {
                name: true,
              },
            },
            subLocation: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        })

        if (!inventoryItem) {
          throw new HTTPException(404, { message: "Inventory item not found" })
        }

        return c.json({ inventoryItem })
      } catch (error) {
        console.error("Error fetching inventory item:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to fetch inventory item" })
      }
    }),

  getInventory: privateProcedure
    .input(z.object({
      productId: z.string().optional(),
      locationId: z.string().optional(),
    }))
    .query(async ({ c, ctx, input }) => {
      const organizationId = ctx.user.currentOrganizationId || ctx.user.organizationId
      if (!organizationId) {
        throw new HTTPException(400, {
          message: "User does not belong to an organization",
        })
      }

      const inventoryItems = await db.inventory.findMany({
        where: {
          organizationId: organizationId,
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
          Location: {
            select: {
              name: true,
            },
          },
          subLocation: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return c.json({ inventoryItems })
    }),

  getProducts: privateProcedure.query(async ({ c, ctx }) => {
    const organizationId = ctx.user.currentOrganizationId || ctx.user.organizationId
    if (!organizationId) {
      throw new HTTPException(400, {
        message: "User does not belong to an organization",
      })
    }

    const products = await db.products.findMany({
      where: { organizationId: organizationId },
      select: {
        id: true,
        name: true,
        sku: true,
        manufacturerBarcodeNumber: true,
        type: true,
      },
      orderBy: { name: "asc" },
    })

    return c.json({ products })
  }),

  // New endpoint for smart suggestions based on product history
  getSmartSuggestions: privateProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .query(async ({ c, ctx, input }) => {
      try {
        const organizationId = ctx.user.currentOrganizationId || ctx.user.organizationId
        if (!organizationId) {
          throw new HTTPException(400, {
            message: "User does not belong to an organization",
          })
        }

        // Get product details
        const product = await db.products.findUnique({
          where: {
            id: input.productId,
            organizationId: organizationId,
          },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            packageCost: true,
            manufacturerBarcodeNumber: true,
          },
        })

        if (!product) {
          throw new HTTPException(404, { message: "Product not found" })
        }

        // Get recent inventory history for this product (last 10 receipts)
        const recentInventory = await db.inventory.findMany({
          where: {
            productId: input.productId,
            organizationId: organizationId,
          },
          include: {
            Location: {
              select: {
                id: true,
                name: true,
              },
            },
            subLocation: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })

        // Analyze patterns
        const vendorStats = recentInventory.reduce((acc, item) => {
          acc[item.vendor] = (acc[item.vendor] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const locationStats = recentInventory.reduce((acc, item) => {
          if (item.locationId) {
            const key = item.locationId
            if (!acc[key]) {
              acc[key] = {
                id: item.locationId,
                name: item.Location?.name || "Unknown",
                count: 0,
                hasSubLocation: !!item.subLocationId,
              }
            }
            acc[key].count++
          }
          return acc
        }, {} as Record<string, { id: string; name: string; count: number; hasSubLocation: boolean }>)

        // Calculate average costs
        const costs = recentInventory.map(item => Number(item.packageCost))
        const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0

        // Get available locations with space
        const locations = await db.location.findMany({
          where: {
            organizationId: organizationId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: { name: "asc" },
        })

        // Sort suggestions by frequency
        const vendorSuggestions = Object.entries(vendorStats)
          .sort(([, a], [, b]) => b - a)
          .map(([vendor, count]) => ({ vendor, count }))

        const locationSuggestions = Object.values(locationStats)
          .sort((a, b) => b.count - a.count)

        return c.json({
          product,
          suggestions: {
            vendors: vendorSuggestions,
            locations: locationSuggestions,
            avgCost: Math.round(avgCost * 100) / 100, // Round to 2 decimal places
            recentReceipts: recentInventory.length,
          },
          availableLocations: locations,
        })
      } catch (error) {
        console.error("Error getting smart suggestions:", error)
        throw new HTTPException(500, {
          message: "Failed to get smart suggestions",
        })
      }
    }),

  createInventory: privateProcedure
    .input(inventoryCreateSchema)
    .mutation(async ({ c, input, ctx }) => {
      try {
        const organizationId = ctx.user.currentOrganizationId || ctx.user.organizationId
        if (!organizationId) {
          throw new HTTPException(400, {
            message: "User does not belong to an organization",
          })
        }

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
          locationId,
          subLocationId,
          notes,
        } = input

        // Check if product exists
        const product = await db.products.findUnique({
          where: {
            id: productId,
            organizationId: organizationId,
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
            organizationId: organizationId,
          },
        })

        // Then create inventory item with reference to the header
        const inventory = await db.inventory.create({
          data: {
            productId,
            price,
            packageCost,
            lotNumber: lotNumber?.trim() || "",
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            serialNumber: serialNumber?.trim() || "",
            vendor: vendor?.trim() || "",
            manufacturer: manufacturer?.trim() || "",
            unitsReceived,
            locationId: locationId || null,
            subLocationId: subLocationId || null,
            notes: notes?.trim() || "",
            userId: ctx.user.id,
            organizationId: organizationId,
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
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ c, ctx, input }) => {
      const organizationId = ctx.user.currentOrganizationId || ctx.user.organizationId
      if (!organizationId) {
        throw new HTTPException(400, {
          message: "User does not belong to an organization",
        })
      }

      const inventoryItem = await db.inventory.findFirst({
        where: {
          id: input.id,
          organizationId: organizationId,
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              type: true,
            },
          },
          Location: {
            select: {
              name: true,
            },
          },
          subLocation: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      })

      if (!inventoryItem) {
        throw new HTTPException(404, { message: "Inventory item not found" })
      }

      return c.json({ inventoryItem })
    }),
})
