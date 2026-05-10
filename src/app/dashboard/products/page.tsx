import { ProductsPageContent } from "./products-page-content"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"

const ProductsPage = async () => {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    return redirect("/welcome")
  }

  return <ProductsPageContent />
}

export default ProductsPage
