import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { PurchaseOrderDetailPageContent } from "./purchase-order-detail-page-content"

interface PageProps {
  params: {
    id: string
  }
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
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
      title="Purchase Order Details"
      hideBackButton={true}
    >
      <PurchaseOrderDetailPageContent user={user} id={params.id} />
    </DashboardPage>
  )
} 