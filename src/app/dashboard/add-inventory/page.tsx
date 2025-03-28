// src/app/dashboard/add-inventory/page.tsx
import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AddInventoryPageContent } from "./add-inventory-page-content"

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
    <DashboardPage title="Add Inventory">
      <AddInventoryPageContent />
    </DashboardPage>
  )
}

export default Page
