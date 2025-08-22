import { DashboardPage } from "@/components/dashboard-page"
import { ReportsPageContent } from "./reports-page-content"

export default function ReportsPage() {
  return (
    <DashboardPage
      title="Reports & Analytics"
      subtitle="Comprehensive inventory reporting and analytics"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Reports & Analytics" }
      ]}
    >
      <ReportsPageContent />
    </DashboardPage>
  )
}
