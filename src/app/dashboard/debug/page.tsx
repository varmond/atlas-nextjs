import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"

export default async function DebugPage() {
  const auth = await currentUser()
  
  if (!auth) {
    redirect("/sign-in")
  }

  try {
    // Get current user
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

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
        
        <div className="space-y-6">
          {/* Auth Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Authentication Info</h2>
            <div className="space-y-1 text-sm">
              <div><strong>External ID:</strong> {auth.id}</div>
              <div><strong>Email:</strong> {auth.emailAddresses[0]?.emailAddress}</div>
              <div><strong>First Name:</strong> {auth.firstName}</div>
              <div><strong>Last Name:</strong> {auth.lastName}</div>
            </div>
          </div>

          {/* Database User Info */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Database User Info</h2>
            {user ? (
              <div className="space-y-1 text-sm">
                <div><strong>User ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Super Admin:</strong> {user.isSuperAdmin ? '✅ Yes' : '❌ No'}</div>
                <div><strong>Current Organization:</strong> {user.currentOrganizationId || 'None'}</div>
                <div><strong>Plan:</strong> {user.plan}</div>
                <div><strong>Quota Limit:</strong> {user.quotaLimit}</div>
                <div><strong>Created At:</strong> {user.createdAt.toLocaleString()}</div>
              </div>
            ) : (
              <div className="text-red-600">
                ❌ User not found in database
              </div>
            )}
          </div>

          {/* Organizations */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Organizations</h2>
            {user && user.userOrganizations.length > 0 ? (
              <div className="space-y-2">
                {user.userOrganizations.map(uo => (
                  <div key={uo.id} className="border p-2 rounded">
                    <div><strong>Organization:</strong> {uo.organization.name}</div>
                    <div><strong>Role:</strong> {uo.role}</div>
                    <div><strong>Active:</strong> {uo.isActive ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Joined:</strong> {uo.joinedAt.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-orange-600">
                ⚠️ No organizations found
              </div>
            )}
          </div>

          {/* Access Check */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Access Permissions</h2>
            {user ? (
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Can access /dashboard/admin:</strong> 
                  {user.isSuperAdmin ? ' ✅ Yes (Super Admin)' : ' ❌ No'}
                </div>
                <div>
                  <strong>Can access /dashboard/users:</strong> 
                  {user.userOrganizations.some(uo => (uo.role === 'ADMIN' || uo.role === 'OWNER') && uo.isActive) ? ' ✅ Yes (Org Admin)' : ' ❌ No'}
                </div>
                <div>
                  <strong>Has current organization:</strong> 
                  {user.currentOrganizationId ? ' ✅ Yes' : ' ❌ No'}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Cannot check permissions - user not found
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
            <div className="space-y-2">
              <a 
                href="/dashboard/admin" 
                className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Admin Panel
              </a>
              <a 
                href="/dashboard/users" 
                className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Try User Management
              </a>
              <a 
                href="/dashboard/users/test-page" 
                className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                User Test Page
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Database Error</h1>
        <div className="bg-red-50 p-4 rounded-lg">
          <pre className="text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    )
  }
}
