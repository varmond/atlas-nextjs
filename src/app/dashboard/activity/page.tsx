import { DashboardPage } from "@/components/dashboard-page"
import { ActivityPageContent } from "./activity-page-content"

export default function ActivityPage() {
  return (
    <DashboardPage
      title="Activity History"
      subtitle="Track all inventory movements and activities"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Activity History" }
      ]}
    >
      <ActivityPageContent />
    </DashboardPage>
  )
}
