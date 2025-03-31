import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"

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
        quantityPerUnit: true,
        quantityPerUnitUOM: true,
        userId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })
    console.log(ctx.user.organizationId)
    return c.superjson({ products })
  }),
  // createProduct: privateProcedure
  //   .input(
  //     z.object({
  //       name: z.string().min(1, "Name is required."),
  //       description: z.string().optional(),
  //       price: z.number().optional(),
  //       sku: z.string().optional(),
  //     })
  //   )
  //   .mutation(async ({ c, ctx, input }) => {
  //     const { user } = ctx
  //     const { name, price, sku } = input

  //     const product = await db.products.create({
  //       data: {
  //         name: name,
  //         price: price ?? 0,
  //         sku: sku ?? "",
  //         userId: user.id,
  //       },
  //     })

  //     return c.json({ product })
  //   }),

  updateProduct: privateProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required."),
        description: z.string().optional(),
        price: z.number().optional(),
        sku: z.string().optional(),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx
      const { id, name, description, price, sku } = input

      const product = await db.products.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          name,
          price,
          sku,
        },
      })

      return c.json({ product })
    }),

  deleteProduct: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, input, ctx }) => {
      const { id } = input

      await db.products.delete({
        where: {
          id,
          userId: ctx.user.id,
        },
      })

      return c.json({ success: true })
    }),
})
