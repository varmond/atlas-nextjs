import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { CreatePurchaseOrderPageContent } from "./create-purchase-order-page-content"

export default async function CreatePurchaseOrderPage() {
  const auth = await currentUser()

  if (!auth) {
    return notFound()
  }

  const user = await db.user.findUnique({
    where: { externalId: auth.id },
    include: {
      organization: true
    }
  })

  if (!user) {
    return notFound()
  }

  return (
    <DashboardPage 
      title="Create Purchase Order"
      hideBackButton={true}
    >
      <CreatePurchaseOrderPageContent user={user} />
    </DashboardPage>
  )
} 