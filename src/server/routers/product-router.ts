import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { Prisma, ProductType, UOM } from "@prisma/client"
import { HTTPException } from "hono/http-exception"

export const productRouter = router({
  getProducts: privateProcedure.query(async ({ c, ctx }) => {
    const products = await db.products.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
      select: {
        id: true,
        itemCode: true,
        name: true,
        price: true,
        packageCost: true,
        manufacturerBarcodeNumber: true,
        sku: true,
        type: true,
        packageUOM: true,
        containerUOM: true,
        quantityPerContainer: true,
        unitUOM: true,
        unitQuantity: true,
        altUOM: true,
        userId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return c.superjson({ products })
  }),

  createProduct: privateProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required."),
        itemCode: z.string().min(1, "Item code is required."),
        price: z.number().min(0, "Price must be a positive number."),
        packageCost: z
          .number()
          .min(0, "Package cost must be a positive number."),
        manufacturerBarcodeNumber: z.string().optional(),
        sku: z.string().optional(),
        type: z.nativeEnum(ProductType),
        packageUOM: z.nativeEnum(UOM),
        containerUOM: z.nativeEnum(UOM),
        quantityPerContainer: z
          .number()
          .int()
          .min(1, "Quantity per container must be at least 1."),
        unitUOM: z.nativeEnum(UOM),
        unitQuantity: z
          .number()
          .min(0, "Unit quantity must be a positive number."),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx
      const {
        name,
        itemCode,
        price,
        packageCost,
        manufacturerBarcodeNumber,
        sku,
        type,
        packageUOM,
        containerUOM,
        quantityPerContainer,
        unitUOM,
        unitQuantity,
      } = input

      // Check if user has an organization
      if (!user.organizationId) {
        throw new HTTPException(400, {
          message: "User does not belong to an organization",
        })
      }

      try {
        const product = await db.products.create({
          data: {
            itemCode,
            name,
            price: new Prisma.Decimal(price),
            packageCost: new Prisma.Decimal(packageCost),
            manufacturerBarcodeNumber: manufacturerBarcodeNumber || "",
            sku: sku || "",
            type,
            packageUOM,
            containerUOM,
            quantityPerContainer,
            unitUOM,
            unitQuantity: new Prisma.Decimal(unitQuantity),
            userId: user.id,
            organizationId: user.organizationId,
          },
        })

        // Convert Decimal objects to strings before returning
        return c.json({
          product: {
            ...product,
            price: product.price.toString(),
            packageCost: product.packageCost.toString(),
            unitQuantity: product.unitQuantity.toString(),
          },
        })
      } catch (error: any) {
        throw new HTTPException(400, {
          message: error.message || "Failed to create product",
        })
      }
    }),

  updateProduct: privateProcedure
    .input(
      z.object({
        id: z.string(),
        itemCode: z.string().min(1, "Item code is required."),
        name: z.string().min(1, "Name is required."),
        price: z.number().min(0, "Price must be a positive number."),
        packageCost: z
          .number()
          .min(0, "Package cost must be a positive number."),
        manufacturerBarcodeNumber: z.string().optional(),
        sku: z.string().optional(),
        type: z.nativeEnum(ProductType),
        packageUOM: z.nativeEnum(UOM),
        containerUOM: z.nativeEnum(UOM),
        quantityPerContainer: z
          .number()
          .int()
          .min(1, "Quantity per container must be at least 1."),
        unitUOM: z.nativeEnum(UOM),
        unitQuantity: z
          .number()
          .min(0, "Unit quantity must be a positive number."),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx
      const {
        id,
        itemCode,
        name,
        price,
        packageCost,
        manufacturerBarcodeNumber,
        sku,
        type,
        packageUOM,
        containerUOM,
        quantityPerContainer,
        unitUOM,
        unitQuantity,
      } = input

      // Check if user has an organization
      if (!user.organizationId) {
        throw new HTTPException(400, {
          message: "User does not belong to an organization",
        })
      }

      try {
        const product = await db.products.update({
          where: {
            id,
            organizationId: user.organizationId,
          },
          data: {
            itemCode,
            name,
            price: new Prisma.Decimal(price),
            packageCost: new Prisma.Decimal(packageCost),
            manufacturerBarcodeNumber: manufacturerBarcodeNumber || "",
            sku: sku || "",
            type,
            packageUOM,
            containerUOM,
            quantityPerContainer,
            unitUOM,
            unitQuantity: new Prisma.Decimal(unitQuantity),
          },
        })

        // Convert Decimal objects to strings before returning
        return c.json({
          product: {
            ...product,
            price: product.price.toString(),
            packageCost: product.packageCost.toString(),
            unitQuantity: product.unitQuantity.toString(),
          },
        })
      } catch (error: any) {
        throw new HTTPException(400, {
          message: error.message || "Failed to update product",
        })
      }
    }),

  deleteProduct: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, input, ctx }) => {
      const { id } = input

      if (!ctx.user.organizationId) {
        throw new HTTPException(400, {
          message: "User does not belong to an organization",
        })
      }

      try {
        await db.products.delete({
          where: {
            id,
            organizationId: ctx.user.organizationId,
          },
        })

        return c.json({ success: true })
      } catch (error: any) {
        throw new HTTPException(400, {
          message: error.message || "Failed to delete product",
        })
      }
    }),
})
