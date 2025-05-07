import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ViewInvoicesPageContent } from "./view-invoices-page-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

export default async function ViewInvoicesPage() {
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
      title="Invoices"
      hideBackButton={true}
      cta={
        <Link href="/dashboard/invoices/create-invoice">
        <Button className="w-full sm:w-fit">
          <PlusIcon className="size-4 mr-2" />
          Create Invoice
        </Button>
          </Link>
      }
    >
      <ViewInvoicesPageContent user={user} />
    </DashboardPage>
  )
} 