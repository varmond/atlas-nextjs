import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { SubLocationsContent } from "./sub-locations-content"

export default async function SubLocationsPage({
  params: { locationId },
}: {
  params: { locationId: string }
}) {
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

  const location = await db.location.findUnique({
    where: { 
      id: locationId,
      organizationId: user.organizationId 
    }
  })

  if (!location) {
    return notFound()
  }

  return (
    <DashboardPage 
      title={`Sub-locations - ${location.name}`}
      // description="Manage sub-locations within this location"
    >
      <SubLocationsContent user={user} locationId={locationId} />
    </DashboardPage>
  )
} 