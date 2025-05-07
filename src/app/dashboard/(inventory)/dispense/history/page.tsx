import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { DispenseHistoryContent } from "./dispense-history-content"

export default async function DispenseHistoryPage() {
  const auth = await currentUser()
  if (!auth) return notFound()

  const user = await db.user.findUnique({
    where: { externalId: auth.id },
    include: { organization: true }
  })
  if (!user) return notFound()

  return (
    <DashboardPage title="Dispense History">
      <DispenseHistoryContent user={user} />
    </DashboardPage>
  )
} 