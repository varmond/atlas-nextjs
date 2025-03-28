// src/app/dashboard/inventory/[id]/page.tsx
import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { InventoryDetailPageContent } from "./inventory-detail-page-content"

interface PageProps {
  params: {
    id: string
  }
}

const Page = async ({ params }: PageProps) => {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    redirect("/welcome")
  }

  // In a real implementation, you would fetch the inventory item from the database
  // For now, we'll assume it exists
  const itemId = params.id

  return (
    <DashboardPage title="Inventory Item Details">
      <InventoryDetailPageContent itemId={itemId} />
    </DashboardPage>
  )
}

export default Page
