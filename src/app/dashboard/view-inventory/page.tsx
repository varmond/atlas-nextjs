// src/app/dashboard/view-inventory/page.tsx
import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { InventoryPageContent } from "./view-inventory-page-content"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import Link from "next/link"

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
        <Link href="/dashboard/add-inventory">
          <Button className="w-full sm:w-fit">
            <PlusIcon className="size-4 mr-2" /> Add Item
          </Button>
        </Link>
      }
      title="Inventory"
    >
      <InventoryPageContent />
    </DashboardPage>
  )
}

export default Page
