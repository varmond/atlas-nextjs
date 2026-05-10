import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { DashboardPage } from "@/components/dashboard-page"

export default async function UserManagementPage() {
  const auth = await currentUser()
  
  if (!auth) {
    redirect("/sign-in")
  }

  // Get current user with organization info
  const user = await db.user.findUnique({
    where: { externalId: auth.id },
    include: {
      userOrganizations: {
        where: { isActive: true },
        include: {
          organization: true
        }
      }
    }
  })

  if (!user) {
    redirect("/dashboard")
  }

  // Check if user has admin access to any organization
  const hasAdminAccess = user.userOrganizations.some(
    uo => uo.role === 'ADMIN' || uo.role === 'OWNER'
  )

  if (!hasAdminAccess && !user.isSuperAdmin) {
    redirect("/dashboard")
  }

  // Get organization users if user has a current organization
  let organizationUsers: any[] = []
  if (user.currentOrganizationId) {
    organizationUsers = await db.userOrganization.findMany({
      where: { 
        organizationId: user.currentOrganizationId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            quotaLimit: true,
            plan: true,
            createdAt: true
          }
        }
      }
    })
  }

  return (
    <DashboardPage 
      title="User Management" 
      subtitle="Manage users within your organization"
      hideBackButton={true}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{organizationUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{organizationUsers.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">👑</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{organizationUsers.filter(u => u.role === 'ADMIN' || u.role === 'OWNER').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-bold">👤</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Members</p>
                <p className="text-2xl font-bold">{organizationUsers.filter(u => u.role === 'MEMBER').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Organization Users</h2>
          </div>
          <div className="p-6">
            {organizationUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No users found in your organization</p>
                <p className="text-sm text-gray-400">
                  {!user.currentOrganizationId 
                    ? "You need to set up an organization first. Run: npm run setup-user-organization 'nredd257@gmail.com' 'Test2'"
                    : "Users will appear here once they're added to your organization"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-hidden rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {organizationUsers.map((userOrg) => (
                      <tr key={userOrg.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {userOrg.user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userOrg.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                            userOrg.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {userOrg.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userOrg.user.plan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userOrg.joinedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPage>
  )
}
