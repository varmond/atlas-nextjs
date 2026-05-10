import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"

export default async function TestPage() {
  const auth = await currentUser()
  
  if (!auth) {
    redirect("/sign-in")
  }

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
        <p>External ID: {auth.id}</p>
        <p>Email: {auth.emailAddresses[0]?.emailAddress}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Test Page</h1>
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
          <strong>Current Organization:</strong> {user.currentOrganizationId || 'None'}
        </div>
        <div>
          <strong>Organizations:</strong>
          <ul className="ml-4 mt-2">
            {user.userOrganizations.map(uo => (
              <li key={uo.id}>
                {uo.organization.name} - {uo.role} ({uo.isActive ? 'Active' : 'Inactive'})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
