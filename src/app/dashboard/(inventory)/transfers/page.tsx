import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { TransferInventoryContent } from "./transfer-inventory-content"

export default async function TransferInventoryPage() {
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
      title="Transfer Inventory"
    >
      <TransferInventoryContent user={user} />
    </DashboardPage>
  )
} 