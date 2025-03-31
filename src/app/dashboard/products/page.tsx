import { DashboardPage } from "@/components/dashboard-page"
import { ProductsPageContent } from "./products-page-content"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import Link from "next/link"

const ProductsPage = async () => {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    return redirect("/welcome")
  }

  return (
    <DashboardPage
      title="Products"
      cta={
        <Link href="/dashboard/add-inventory">
          <Button className="w-full sm:w-fit">
            <PlusIcon className="size-4 mr-2" /> Add Product
          </Button>
        </Link>
      }
    >
      <ProductsPageContent />
    </DashboardPage>
  )
}

export default ProductsPage
