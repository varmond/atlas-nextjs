import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { CreateInvoicePageContent } from "./create-invoice-page-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CreateInvoicePage() {
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
      title="Create Invoice">
      <CreateInvoicePageContent user={user} />
    </DashboardPage>
  )
} 