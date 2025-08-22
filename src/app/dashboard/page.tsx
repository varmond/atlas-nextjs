import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DashboardPageContent } from "./dashboard-page-content"
import { createCheckoutSession } from "@/lib/stripe"
import { PaymentSuccessModal } from "@/components/payment-success-modal"

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

const Page = async ({ searchParams }: PageProps) => {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    return redirect("/welcome")
  }

  const intent = searchParams.intent

  if (intent === "upgrade") {
    const session = await createCheckoutSession({
      userEmail: user.email,
      userId: user.id,
    })

    if (session.url) redirect(session.url)
  }

  const success = searchParams.success

  return (
    <>
      {success ? <PaymentSuccessModal /> : null}
      <DashboardPage
        title="Dashboard"
        subtitle="Inventory management overview and quick actions"
        hideBackButton
      >
        <DashboardPageContent />
      </DashboardPage>
    </>
  )
}

export default Page
