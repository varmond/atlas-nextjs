import { DashboardPage } from "@/components/dashboard-page"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import AdminDashboardContent from "./admin-dashboard-content"

export default async function AdminDashboardPage() {
  const auth = await currentUser()

  if (!auth) {
    redirect("/sign-in")
  }

  const user = await db.user.findUnique({ 
    where: { externalId: auth.id },
    include: {
      userOrganizations: {
        include: {
          organization: true
        }
      }
    }
  })

  if (!user) {
    return redirect("/welcome")
  }

  // Check if user is super admin
  if (!user.isSuperAdmin) {
    redirect("/dashboard")
  }

  return (
    <DashboardPage 
      title="Support Dashboard" 
      subtitle="Internal support tools for customer assistance and system management"
      hideBackButton={true}
    >
      <AdminDashboardContent />
    </DashboardPage>
  )
}
