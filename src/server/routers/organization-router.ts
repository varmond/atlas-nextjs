import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { shouldGrantSuperAdmin, isSuperAdmin } from "@/lib/super-admin"

async function checkSuperAdmin(email: string, role: string): Promise<boolean> {
  // Check if user should be granted super admin access
  if (shouldGrantSuperAdmin(email)) {
    return true
  }
  
  // For now, also allow OWNER role users (you can remove this later)
  if (role === 'OWNER') {
    return true
  }
  
  return false
}

export const organizationRouter = router({
  // Simple version that works with current schema
  getUserOrganizations: privateProcedure.query(async ({ c, ctx }) => {
    try {
      // Get all organizations the user belongs to
      const organizations = await db.organization.findMany({
        where: {
          users: {
            some: {
              id: ctx.user.id
            }
          }
        },
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
          planType: true,
        },
        orderBy: {
          name: 'asc'
        }
      })

      // Convert to user-organization format for consistency
      const userOrgs = organizations.map(org => ({
        id: `user-org-${ctx.user.id}-${org.id}`,
        userId: ctx.user.id,
        organizationId: org.id,
        role: 'OWNER', // For now, assume owner role
        isActive: true,
        joinedAt: new Date(),
        organization: org
      }))

      return c.json({ organizations: userOrgs })
    } catch (error) {
      console.error("Error fetching user organizations:", error)
      throw new HTTPException(500, { message: "Failed to fetch organizations" })
    }
  }),

  getCurrentOrganization: privateProcedure.query(async ({ c, ctx }) => {
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        include: {
          organization: true
        }
      })

      if (!user?.organization) {
        throw new HTTPException(404, { message: "No organization found" })
      }

      return c.json({ organization: user.organization })
    } catch (error) {
      console.error("Error fetching current organization:", error)
      throw new HTTPException(500, { message: "Failed to fetch current organization" })
    }
  }),

  // For now, this will just return success since we can't switch yet
  switchOrganization: privateProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        // Check if user belongs to this organization
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          include: { organization: true }
        })

        if (!user?.organization || user.organization.id !== input.organizationId) {
          throw new HTTPException(403, { message: "Access denied to this organization" })
        }

        return c.json({ 
          success: true, 
          organization: user.organization 
        })
      } catch (error) {
        console.error("Error switching organization:", error)
        throw new HTTPException(500, { message: "Failed to switch organization" })
      }
    }),

  createOrganization: privateProcedure
    .input(z.object({
      name: z.string().min(1, "Organization name is required"),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        // Check if user is super admin
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            email: true,
            role: true,
          }
        })

        if (!user || !(await checkSuperAdmin(user.email, user.role))) {
          throw new HTTPException(403, { message: "Only super admins can create organizations" })
        }

        // Find the nredd257@gmail.com user
        const nreddUser = await db.user.findUnique({
          where: { email: 'nredd257@gmail.com' },
          select: { id: true }
        })

        // Create new organization with both users
        const organization = await db.organization.create({
          data: {
            name: input.name,
            subscriptionStatus: 'ACTIVE',
            planType: 'FREE',
            // Add the current user to this organization
            users: {
              connect: [
                { id: ctx.user.id },
                // Also add nredd257@gmail.com if found
                ...(nreddUser ? [{ id: nreddUser.id }] : [])
              ]
            }
          }
        })

        return c.json({ 
          success: true, 
          organization: {
            id: organization.id,
            name: organization.name,
            subscriptionStatus: organization.subscriptionStatus,
            planType: organization.planType,
          },
          message: `Organization created successfully. You can switch to it from the organization selector.${nreddUser ? ' nredd257@gmail.com has also been added to this organization.' : ''}`
        })
      } catch (error) {
        console.error("Error creating organization:", error)
        if (error instanceof HTTPException) {
          throw error
        }
        throw new HTTPException(500, { message: "Failed to create organization" })
      }
    }),

  // Super admin functions - simplified for now
  getAllOrganizations: privateProcedure.query(async ({ c, ctx }) => {
    try {
      // Check if user is super admin
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          email: true,
          role: true,
        }
      })

      if (!user || !(await checkSuperAdmin(user.email, user.role))) {
        throw new HTTPException(403, { message: "Only super admins can view all organizations" })
      }

      // Get all organizations with user counts
      const organizations = await db.organization.findMany({
        include: {
          users: {
            select: {
              id: true,
              email: true,
              role: true,
            }
          },
          _count: {
            select: {
              users: true,
              Products: true,
              Inventory: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return c.json({ organizations })
    } catch (error) {
      console.error("Error fetching all organizations:", error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: "Failed to fetch organizations" })
    }
  }),

  addUserToOrganization: privateProcedure
    .input(z.object({
      userEmail: z.string().email("Invalid email"),
      organizationId: z.string(),
      role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
    }))
    .mutation(async ({ c, input, ctx }) => {
      try {
        // Check if user is super admin
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            email: true,
            role: true,
          }
        })

        if (!user || !(await checkSuperAdmin(user.email, user.role))) {
          throw new HTTPException(403, { message: "Only super admins can add users to organizations" })
        }

        // For now, just return success - we'll implement this after migration
        return c.json({ 
          success: true, 
          message: "User addition will be available after database migration" 
        })
      } catch (error) {
        console.error("Error adding user to organization:", error)
        if (error instanceof HTTPException) {
          throw error
        }
        throw new HTTPException(500, { message: "Failed to add user to organization" })
      }
    }),

  getOrganizationMembers: privateProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .query(async ({ c, input, ctx }) => {
      try {
        // Check if user is super admin or belongs to the organization
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            email: true,
            role: true,
            organizationId: true,
          }
        })

        if (!user) {
          throw new HTTPException(404, { message: "User not found" })
        }

        // Allow if super admin or if user belongs to the organization
        const isUserSuperAdmin = await checkSuperAdmin(user.email, user.role)
        const belongsToOrg = user.organizationId === input.organizationId

        if (!isUserSuperAdmin && !belongsToOrg) {
          throw new HTTPException(403, { message: "Access denied to organization members" })
        }

        // For now, return the current user as the only member
        const currentUser = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          }
        })

        if (!currentUser) {
          return c.json({ members: [] })
        }

        const member = {
          id: `member-${currentUser.id}`,
          userId: currentUser.id,
          organizationId: input.organizationId,
          role: currentUser.role,
          isActive: true,
          joinedAt: currentUser.createdAt,
          user: {
            id: currentUser.id,
            email: currentUser.email,
            createdAt: currentUser.createdAt,
          }
        }

        return c.json({ members: [member] })
      } catch (error) {
        console.error("Error fetching organization members:", error)
        if (error instanceof HTTPException) {
          throw error
        }
        throw new HTTPException(500, { message: "Failed to fetch organization members" })
      }
    }),
}) 