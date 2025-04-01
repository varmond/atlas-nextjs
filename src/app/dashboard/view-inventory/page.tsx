import { DashboardPage } from "@/components/dashboard-page"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { ViewInventoryPageContent } from "./view-inventory-page-content"

// export const metadata = {
//   title: "View Inventory | PeppersAtlas",
//   description: "View and manage your inventory items",
// }

export default async function ViewInventoryPage() {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    return redirect("/welcome")
  }

  // Fetch inventory items for server rendering
  const inventoryItems = await db.inventory.findMany({
    where: { organizationId: user.organizationId ?? "" },
    include: {
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Convert Decimal values to strings for serialization
  const serializedInventory = inventoryItems.map((item) => ({
    ...item,
    price: item.price.toString(),
    packageCost: item.packageCost.toString(),
  }))

  return (
    <DashboardPage title="Inventory" hideBackButton={true}>
      <ViewInventoryPageContent initialInventory={serializedInventory} />
    </DashboardPage>
  )
}
