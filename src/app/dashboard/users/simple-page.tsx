import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"

export default async function SimpleUserPage() {
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

    if (!user) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p>Your user account was not found in the database.</p>
        </div>
      )
    }

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Simple User Management</h1>
        <div className="space-y-4">
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Super Admin:</strong> {user.isSuperAdmin ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Organizations:</strong> {user.userOrganizations.length}
          </div>
          <div>
            <strong>Can access admin:</strong> {user.isSuperAdmin ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <pre className="text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
}
