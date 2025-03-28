// src/app/dashboard/inventory/page.tsx
import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { InventoryPageContent } from "./inventory-page-content"
import { CreateInventoryItemModal } from "@/components/create-inventory-item-modal"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const Page = async () => {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    redirect("/welcome")
  }

  return (
    <DashboardPage
      cta={
        <CreateInventoryItemModal>
          <Button className="w-full sm:w-fit">
            <PlusIcon className="size-4 mr-2" /> Add Item
          </Button>
        </CreateInventoryItemModal>
      }
      title="Inventory"
    >
      <InventoryPageContent />
    </DashboardPage>
  )
}

export default Page
