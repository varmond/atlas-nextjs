import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ViewPurchaseOrdersPageContent } from "./view-purchase-orders-page-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

export default async function ViewPurchaseOrdersPage() {
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
      title="Purchase Orders"
      cta={
        <Button className="w-full sm:w-fit">
          <PlusIcon className="size-4 mr-2" />
          <Link href="/dashboard/purchasing/create-purchase-order">Create Purchase Order</Link>
        </Button>
      }
    >
      <ViewPurchaseOrdersPageContent user={user} />
    </DashboardPage>
  )
} 