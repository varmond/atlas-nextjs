import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { requireActiveOrganizationId } from "@/lib/active-organization"

const invoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  inventoryId: z.string().min(1, "Inventory item is required"),
})

const invoiceSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  locationId: z.string().min(1, "Location is required"),
  items: z.array(invoiceItemSchema),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "POSTED"]),
})

export const invoiceRouter = router({
  // Get all invoices
  getInvoices: privateProcedure.query(async ({ c, ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.user)
    const invoices = await db.invoice.findMany({
      where: { organizationId },
      select: {
        id: true,
        invoiceNumber: true,
        createdAt: true,
        status: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { invoiceNumber: "desc" },
    })

    return c.json({ invoices })
  }),

  // Get single invoice
  getInvoice: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ c, ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.user)
      const invoice = await db.invoice.findFirst({
        where: {
          id: input.id,
          organizationId,
        },
        select: {
          id: true,
          invoiceNumber: true,
          createdAt: true,
          status: true,
          notes: true,
          locationId: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          location: true,
          items: {
            include: {
              product: true,
              inventory: true,
            },
          },
        },
      })

      if (!invoice) {
        throw new HTTPException(404, { message: "Invoice not found" })
      }
      console.log(invoice)
      return c.json({ invoice })
    }),

  // Create or update draft invoice
  saveDraft: privateProcedure
    .input(invoiceSchema)
    .mutation(async ({ c, ctx, input }) => {
      const { patientId, locationId, items, notes } = input
      const organizationId = requireActiveOrganizationId(ctx.user)

      // Get the latest invoice number
      const latestInvoice = await db.invoice.findFirst({
        where: { organizationId },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      })

      const nextInvoiceNumber = (latestInvoice?.invoiceNumber ?? 999) + 1

      // Create invoice with new number
      const invoice = await db.invoice.create({
        data: {
          invoiceNumber: nextInvoiceNumber,
          patientId,
          locationId,
          notes,
          status: "DRAFT",
          organizationId,
          userId: ctx.user.id,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              inventoryId: item.inventoryId,
            })),
          },
        },
        include: {
          items: true,
          patient: true,
          location: true,
        },
      })

      return c.json({ invoice })
    }),

  // Post invoice and update inventory
  postInvoice: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, ctx, input }) => {
      // Start transaction
      return await db.$transaction(async (tx) => {
        const organizationId = requireActiveOrganizationId(ctx.user)
        // Get invoice with items
        const invoice = await tx.invoice.findFirst({
          where: {
            id: input.id,
            organizationId,
          },
          include: {
            items: true,
          },
        })

        if (!invoice) {
          throw new HTTPException(404, { message: "Invoice not found" })
        }

        if (invoice.status === "POSTED") {
          throw new HTTPException(400, { message: "Invoice already posted" })
        }

        // Update inventory for each item
        for (const item of invoice.items) {
          const inventory = await tx.inventory.findFirst({
            where: { id: item.inventoryId, organizationId },
          })

          if (!inventory) {
            throw new HTTPException(404, {
              message: `Inventory item ${item.inventoryId} not found`,
            })
          }

          if (inventory.unitsReceived < item.quantity) {
            throw new HTTPException(400, {
              message: `Insufficient inventory for product ${item.productId}`,
            })
          }

          // Decrement inventory
          await tx.inventory.update({
            where: { id: item.inventoryId },
            data: {
              unitsReceived: inventory.unitsReceived - item.quantity,
            },
          })
        }

        // Update invoice status
        const updatedInvoice = await tx.invoice.update({
          where: { id: input.id },
          data: { status: "POSTED" },
          include: {
            patient: true,
            location: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        })

        return c.json({ invoice: updatedInvoice })
      })
    }),

  addItems: privateProcedure
    .input(z.object({
      invoiceId: z.string(),
      items: z.array(invoiceItemSchema),
    }))
    .mutation(async ({ c, ctx, input }) => {
      const { invoiceId, items } = input
      const organizationId = requireActiveOrganizationId(ctx.user)

      const existing = await db.invoice.findFirst({
        where: { id: invoiceId, organizationId },
      })
      if (!existing) {
        throw new HTTPException(404, { message: "Invoice not found" })
      }

      const invoice = await db.invoice.update({
        where: { id: invoiceId },
        data: {
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              inventoryId: item.inventoryId,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
              inventory: true,
            },
          },
          patient: true,
          location: true,
        },
      })

      return c.json({ invoice })
     }),
}) 