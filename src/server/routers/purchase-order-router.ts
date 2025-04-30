import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { PurchaseOrderPDF } from "@/components/purchase-order-pdf"
import { pdf, Document, Page, renderToStream, renderToFile } from "@react-pdf/renderer"
import React from "react"
import { resend } from "@/lib/resend"
import { readFile } from "fs/promises"
import path from "path"
import { generatePDF } from "@/lib/pdf"

const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
})

const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  locationId: z.string().min(1, "Location is required"),
  items: z.array(purchaseOrderItemSchema),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "POSTED", "RECEIVED", "CANCELLED"]),
})

const createPurchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  locationId: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "POSTED", "RECEIVED", "CANCELLED"]),
})

export const purchaseOrderRouter = router({
  getPurchaseOrders: privateProcedure.query(async ({ c, ctx }) => {
    try {
      const purchaseOrders = await db.purchaseOrder.findMany({
        where: { 
          organizationId: ctx.user.organizationId ?? "" 
        },
        include: {
          vendor: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { orderNumber: "desc" },
      })

      return c.json({ purchaseOrders })
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      throw new HTTPException(500, { message: "Failed to fetch purchase orders" })
    }
  }),

  createPurchaseOrder: privateProcedure
    .input(createPurchaseOrderSchema)
    .mutation(async ({ c, ctx, input }) => {
      const { vendorId, locationId, notes } = input

      // Get the latest PO number
      const latestPO = await db.purchaseOrder.findFirst({
        where: { organizationId: ctx.user.organizationId ?? "" },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      })

      const nextOrderNumber = (latestPO?.orderNumber ?? 999) + 1

      // Create PO with new number
      const purchaseOrder = await db.purchaseOrder.create({
        data: {
          orderNumber: nextOrderNumber,
          vendorId,
          locationId,
          notes,
          status: "DRAFT",
          organizationId: ctx.user.organizationId ?? "",
          userId: ctx.user.id,
        },
        include: {
          vendor: true,
          location: true,
        },
      })

      return c.json({ purchaseOrder })
    }),

  getPurchaseOrder: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ c, ctx, input }) => {
      const purchaseOrder = await db.purchaseOrder.findUnique({
        where: {
          id: input.id,
          organizationId: ctx.user.organizationId ?? "",
        },
        include: {
          vendor: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      if (!purchaseOrder) {
        throw new HTTPException(404, { message: "Purchase order not found" })
      }

      return c.json({ purchaseOrder })
    }),

  addItems: privateProcedure
    .input(z.object({
      purchaseOrderId: z.string(),
      items: z.array(purchaseOrderItemSchema),
    }))
    .mutation(async ({ c, ctx, input }) => {
      const { purchaseOrderId, items } = input

      const purchaseOrder = await db.purchaseOrder.update({
        where: {
          id: purchaseOrderId,
          organizationId: ctx.user.organizationId ?? "",
        },
        data: {
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          vendor: true,
          location: true,
        },
      })

      return c.json({ purchaseOrder })
    }),

  postPurchaseOrder: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, ctx, input }) => {
      try {
        // Start transaction
        return await db.$transaction(async (tx) => {
          // Get purchase order with all related data
          const purchaseOrder = await tx.purchaseOrder.update({
            where: {
              id: input.id,
              organizationId: ctx.user.organizationId ?? "",
            },
            data: {
              status: "POSTED",
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
              vendor: true,
              location: true,
              organization: true,
            },
          })

          if (!purchaseOrder.vendor.email) {
            throw new HTTPException(400, { message: "Vendor email is required" })
          }

          // Generate PDF and get base64 string
        const pdfBase64 = await generatePDF(PurchaseOrderPDF, {
          purchaseOrder,
          organizationName: purchaseOrder.organization.name
        })

        // Send email with PDF attachment
        await resend.emails.send({
          from: 'Acme <onboarding@resend.dev>',
          to: purchaseOrder.vendor.email,
          subject: `Purchase Order #${purchaseOrder.orderNumber}`,
          html: `
            <p>Dear ${purchaseOrder.vendor.name},</p>
            <p>Please find attached Purchase Order #${purchaseOrder.orderNumber} from ${purchaseOrder.organization.name}.</p>
            <p>If you have any questions or concerns, please contact us directly.</p>
            <p>Best regards,<br/>${purchaseOrder.organization.name}</p>
          `,
          attachments: [
            {
              filename: `PO-${purchaseOrder.orderNumber}.pdf`,
              content: pdfBase64 as string,
            },
          ],
        })

          return c.json({ purchaseOrder })
        })
      } catch (error) {
        console.error('Error posting purchase order:', error)
        throw new HTTPException(500, { 
          message: error instanceof Error ? error.message : "Failed to post purchase order" 
        })
      }
    }),
}) 