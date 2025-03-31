import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ProductPageContent } from "./product-page-content"

interface PageProps {
  params: {
    id: string | string[] | undefined
  }
}

const Page = async ({ params }: PageProps) => {
  if (typeof params.id !== "string") notFound()

  const auth = await currentUser()

  if (!auth) {
    return notFound()
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    return notFound()
  }

  const product = await db.products.findUnique({
    where: {
      id: params.id,
      organizationId: user.organizationId?.toString(),
    },
  })

  if (!product) {
    return notFound()
  }

  return (
    <DashboardPage title={`${product.name}`}>
      <ProductPageContent product={product} />
    </DashboardPage>
  )
}

export default Page
