import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { shouldGrantSuperAdmin } from "@/lib/super-admin"
import { sendClerkInvitation } from "@/lib/clerk-invite"
import {
  findOrCreatePendingUserByEmail,
  normalizeEmail,
} from "@/lib/pending-user"

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
      // Get all organizations the user belongs to via UserOrganization
      const userOrganizations = await db.userOrganization.findMany({
        where: {
          userId: ctx.user.id,
          isActive: true
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              subscriptionStatus: true,
              planType: true,
            }
          }
        },
        orderBy: {
          organization: {
            name: 'asc'
          }
        }
      })

      // Convert to the expected format
      const userOrgs = userOrganizations.map(userOrg => ({
        id: userOrg.id,
        userId: userOrg.userId,
        organizationId: userOrg.organizationId,
        role: userOrg.role,
        isActive: userOrg.isActive,
        joinedAt: userOrg.joinedAt,
        organization: userOrg.organization
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
          currentOrganization: true
        }
      })

      if (!user?.currentOrganization) {
        throw new HTTPException(404, { message: "No organization found" })
      }

      return c.json({ organization: user.currentOrganization })
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
        // Check if user belongs to this organization via UserOrganization
        const userOrg = await db.userOrganization.findFirst({
          where: { 
            userId: ctx.user.id,
            organizationId: input.organizationId,
            isActive: true
          },
          include: { organization: true }
        })

        if (!userOrg) {
          throw new HTTPException(403, { message: "Access denied to this organization" })
        }

        // Update user's current organization
        await db.user.update({
          where: { id: ctx.user.id },
          data: { currentOrganizationId: input.organizationId }
        })

        return c.json({ 
          success: true, 
          organization: userOrg.organization,
          role: userOrg.role
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

        // Create new organization
        const organization = await db.organization.create({
          data: {
            name: input.name,
            subscriptionStatus: 'ACTIVE',
            planType: 'FREE',
          }
        })

        // Add the current user to this organization via UserOrganization
        await db.userOrganization.create({
          data: {
            userId: ctx.user.id,
            organizationId: organization.id,
            role: 'OWNER',
            isActive: true
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
          message: `Organization created successfully. You can switch to it from the organization selector.`,
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
          userOrganizations: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                }
              }
            }
          },
          _count: {
            select: {
              userOrganizations: true,
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
        const adminUser = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            email: true,
            role: true,
          }
        })

        if (!adminUser || !(await checkSuperAdmin(adminUser.email, adminUser.role))) {
          throw new HTTPException(403, { message: "Only super admins can add users to organizations" })
        }

        const targetUser = await findOrCreatePendingUserByEmail(input.userEmail)

        const org = await db.organization.findUnique({
          where: { id: input.organizationId },
          select: { id: true },
        })
        if (!org) {
          throw new HTTPException(404, { message: "Organization not found" })
        }

        const existing = await db.userOrganization.findFirst({
          where: {
            userId: targetUser.id,
            organizationId: input.organizationId,
          },
        })
        if (existing) {
          throw new HTTPException(400, { message: "User is already a member of this practice" })
        }

        const userOrg = await db.userOrganization.create({
          data: {
            userId: targetUser.id,
            organizationId: input.organizationId,
            role: input.role,
            isActive: true,
          },
        })

        await db.user.update({
          where: { id: targetUser.id },
          data: {
            currentOrganizationId: input.organizationId,
            organizationId: input.organizationId,
          },
        })

        try {
          await sendClerkInvitation(normalizeEmail(input.userEmail))
        } catch (e) {
          console.error("Clerk invitation failed (membership still created):", e)
        }

        return c.json({
          success: true,
          membership: userOrg,
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
          }
        })

        if (!user) {
          throw new HTTPException(404, { message: "User not found" })
        }

        // Check if user belongs to the organization via UserOrganization
        const userOrg = await db.userOrganization.findFirst({
          where: {
            userId: ctx.user.id,
            organizationId: input.organizationId,
            isActive: true
          }
        })

        // Allow if super admin or if user belongs to the organization
        const isUserSuperAdmin = await checkSuperAdmin(user.email, user.role)
        const belongsToOrg = !!userOrg

        if (!isUserSuperAdmin && !belongsToOrg) {
          throw new HTTPException(403, { message: "Access denied to organization members" })
        }

        // Get all members of the organization
        const members = await db.userOrganization.findMany({
          where: {
            organizationId: input.organizationId,
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        })

        const formattedMembers = members.map(member => ({
          id: member.id,
          userId: member.userId,
          organizationId: member.organizationId,
          role: member.role,
          isActive: member.isActive,
          joinedAt: member.joinedAt,
          user: member.user
        }))

        return c.json({ members: formattedMembers })
      } catch (error) {
        console.error("Error fetching organization members:", error)
        if (error instanceof HTTPException) {
          throw error
        }
        throw new HTTPException(500, { message: "Failed to fetch organization members" })
      }
    }),
}) 