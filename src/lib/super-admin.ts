import { User } from "@prisma/client"
import { db } from "@/db"

// Default super admin emails (for initial setup only)
const DEFAULT_SUPER_ADMIN_EMAILS = [
  "nick@peppersatlas.com", // Replace with your email
]

export async function isSuperAdmin(user: User): Promise<boolean> {
  try {
    // Check if user has super admin flag in database (primary method)
    const result = await db.$queryRaw<Array<{ isSuperAdmin: boolean }>>`
      SELECT "isSuperAdmin"
      FROM "User" 
      WHERE id = ${user.id}
    `
    
    if (result[0]?.isSuperAdmin) {
      return true
    }
  } catch (error) {
    console.warn('Could not check database isSuperAdmin field:', error)
  }
  
  // Fallback to email-based check (for backward compatibility)
  if (DEFAULT_SUPER_ADMIN_EMAILS.includes(user.email)) {
    return true
  }
  
  // Check environment variable (for emergency access)
  const envSuperAdmins = process.env.SUPER_ADMIN_EMAILS?.split(',') || []
  if (envSuperAdmins.includes(user.email)) {
    return true
  }
  
  return false
}

export function getSuperAdminEmails(): string[] {
  return [
    ...DEFAULT_SUPER_ADMIN_EMAILS,
    ...(process.env.SUPER_ADMIN_EMAILS?.split(',') || [])
  ].filter(Boolean)
}

// Helper function to check if a user should be granted super admin access
export function shouldGrantSuperAdmin(email: string): boolean {
  return DEFAULT_SUPER_ADMIN_EMAILS.includes(email) || 
         (process.env.SUPER_ADMIN_EMAILS?.split(',') || []).includes(email)
} 