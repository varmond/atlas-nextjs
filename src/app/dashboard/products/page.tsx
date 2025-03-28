import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ProductPageContent } from "./product-page-content"

const Page = async () => {
  const auth = await currentUser()

  if (!auth) {
    return notFound()
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    return notFound()
  }

  return (
    <DashboardPage title="Products">
      <ProductPageContent />
    </DashboardPage>
  )
}

export default Page
