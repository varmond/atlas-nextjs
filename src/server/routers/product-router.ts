import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"

export const productRouter = router({
  getProducts: privateProcedure.query(async ({ c, ctx }) => {
    const products = await db.products.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
      select: {
        id: true,
        name: true,
        price: true,
        cost: true,
        manufacturerBarcodeNumber: true,
        code: true,
        type: true,
        uom: true,
        unitsPer: true,
        quantity: true,
        quantityUOM: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })
    return c.superjson({ products })
  }),
})
