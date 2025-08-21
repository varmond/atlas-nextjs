import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { OrganizationManagement } from "@/components/organization-management"
import { shouldGrantSuperAdmin, isSuperAdmin } from "@/lib/super-admin"

export default async function OrganizationsAdminPage() {
  const auth = await currentUser()
  if (!auth) {
    console.log("No auth user found")
    return notFound()
  }

  const userEmail = auth.emailAddresses[0]?.emailAddress
  console.log("Auth user:", userEmail)

  const user = await db.user.findUnique({
    where: { externalId: auth.id },
    include: { organization: true }
  })
  
  if (!user) {
    console.log("No user found in database")
    return notFound()
  }

  console.log("User found:", user.email, "Role:", user.role)

  // Check if user is super admin
  const isUserSuperAdmin = await isSuperAdmin(user) || shouldGrantSuperAdmin(user.email) || user.role === 'OWNER'

  if (!isUserSuperAdmin) {
    console.log("User is not super admin")
    return notFound()
  }

  return (
    <DashboardPage title="Organization Management">
      <OrganizationManagement />
    </DashboardPage>
  )
} 