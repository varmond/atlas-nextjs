// This is your server component page.tsx
import { ProductPageContent } from "./product-page-content"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: PageProps) {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user || !user.organizationId) {
    return notFound()
  }

  // Fetch the product by ID
  const product = await db.products.findUnique({
    where: {
      id: params.id,
      organizationId: user.organizationId,
    },
  })

  if (!product) {
    return notFound()
  }

  // Serialize the product to prevent Decimal serialization issues
  const serializedProduct = {
    ...product,
    price: product.price.toString(),
    packageCost: product.packageCost.toString(),
    unitQuantity: product.unitQuantity.toString(),
  }

  return <ProductPageContent product={serializedProduct} />
}

//<EditProductModal product={product} />
