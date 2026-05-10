import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { OrganizationPlan, SubscriptionStatus } from "@prisma/client"
import {
  getActiveOrganizationId,
  requireActiveOrganizationId,
} from "@/lib/active-organization"
import { sendClerkInvitation } from "@/lib/clerk-invite"
import {
  findOrCreatePendingUserByEmail,
  normalizeEmail,
} from "@/lib/pending-user"

// Admin-only middleware
const adminOnly = privateProcedure.use(async ({ c, ctx, next }) => {
  if (!ctx.user.isSuperAdmin) {
    throw new HTTPException(403, { message: "Admin access required" })
  }
  return next()
})

// Organization admin middleware — must be ADMIN/OWNER of the **active** practice only
const orgAdminOnly = privateProcedure.use(async ({ c, ctx, next }) => {
  const organizationId = getActiveOrganizationId(ctx.user)
  if (!organizationId) {
    throw new HTTPException(400, {
      message: "Select a practice before managing users or settings.",
    })
  }

  const userOrg = await db.userOrganization.findFirst({
    where: {
      userId: ctx.user.id,
      organizationId,
      isActive: true,
      role: { in: ["ADMIN", "OWNER"] },
    },
  })

  if (!userOrg) {
    throw new HTTPException(403, {
      message: "Organization admin access required for this practice.",
    })
  }

  return next()
})

export const adminRouter = router({
  // Super Admin Routes
  getSystemStats: adminOnly
    .query(async ({ c }) => {
      try {
        const [
          totalOrganizations,
          totalUsers,
          activeOrganizations,
          newOrganizationsThisMonth,
          newUsersThisMonth
        ] = await Promise.all([
          db.organization.count(),
          db.user.count(),
          db.organization.count({ where: { subscriptionStatus: 'ACTIVE' } }),
          db.organization.count({
            where: {
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }),
          db.user.count({
            where: {
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          })
        ])

        return c.json({
          totalOrganizations,
          totalUsers,
          activeOrganizations,
          newOrganizationsThisMonth,
          newUsersThisMonth,
          totalRevenue: 0, // TODO: Integrate with Stripe
          systemHealth: {
            databaseConnections: 0, // TODO: Add monitoring
            apiResponseTime: 0,
            errorRate: 0
          }
        })
      } catch (error) {
        console.error("Error fetching system stats:", error)
        throw new HTTPException(500, { message: "Failed to fetch system stats" })
      }
    }),

  getAllOrganizations: adminOnly
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(['active', 'suspended', 'pending']).optional()
    }))
    .query(async ({ c, input }) => {
      try {
        const skip = (input.page - 1) * input.limit
        const where: any = {}
        
        if (input.search) {
          where.name = { contains: input.search, mode: 'insensitive' }
        }
        
        if (input.status) {
          const map: Record<string, SubscriptionStatus> = {
            active: 'ACTIVE',
            suspended: 'SUSPENDED',
            pending: 'ACTIVE',
          }
          where.subscriptionStatus = map[input.status] ?? 'ACTIVE'
        }

        const [organizations, total] = await Promise.all([
          db.organization.findMany({
            where,
            include: {
              userOrganizations: {
                include: {
                  user: true
                }
              },
              _count: {
                select: { 
                  userOrganizations: true,
                  Inventory: true 
                }
              }
            },
            skip,
            take: input.limit,
            orderBy: { createdAt: 'desc' }
          }),
          db.organization.count({ where })
        ])

        return c.json({
          organizations,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit)
        })
      } catch (error) {
        console.error("Error fetching organizations:", error)
        throw new HTTPException(500, { message: "Failed to fetch organizations" })
      }
    }),

  updateOrganization: adminOnly
    .input(z.object({
      organizationId: z.string(),
      name: z.string().optional(),
      subscriptionStatus: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED']).optional(),
      planType: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
    }))
    .mutation(async ({ c, input }) => {
      try {
        const data: {
          name?: string
          subscriptionStatus?: SubscriptionStatus
          planType?: OrganizationPlan
        } = {}
        if (input.name !== undefined) data.name = input.name
        if (input.subscriptionStatus !== undefined) data.subscriptionStatus = input.subscriptionStatus
        if (input.planType !== undefined) data.planType = input.planType

        const organization = await db.organization.update({
          where: { id: input.organizationId },
          data,
        })

        return c.json({ organization })
      } catch (error) {
        console.error("Error updating organization:", error)
        throw new HTTPException(500, { message: "Failed to update organization" })
      }
    }),

  /** Provision a new practice (tenant). Optionally attach an existing user as OWNER by id or email. */
  createPractice: adminOnly
    .input(z.object({
      name: z.string().min(1),
      planType: z.nativeEnum(OrganizationPlan).optional(),
      subscriptionStatus: z.nativeEnum(SubscriptionStatus).optional(),
      ownerUserId: z.string().optional(),
      ownerEmail: z.string().email().optional(),
    }))
    .mutation(async ({ c, input }) => {
      try {
        const organization = await db.organization.create({
          data: {
            name: input.name,
            planType: input.planType ?? OrganizationPlan.FREE,
            subscriptionStatus: input.subscriptionStatus ?? SubscriptionStatus.ACTIVE,
          },
        })

        let ownerId: string | undefined = input.ownerUserId
        if (!ownerId && input.ownerEmail) {
          const pending = await findOrCreatePendingUserByEmail(input.ownerEmail)
          ownerId = pending.id
        }

        if (ownerId) {
          await db.userOrganization.create({
            data: {
              userId: ownerId,
              organizationId: organization.id,
              role: 'OWNER',
              isActive: true,
            },
          })
          await db.user.update({
            where: { id: ownerId },
            data: {
              currentOrganizationId: organization.id,
              organizationId: organization.id,
            },
          })
        }

        if (input.ownerEmail) {
          try {
            await sendClerkInvitation(normalizeEmail(input.ownerEmail))
          } catch (e) {
            console.error("Clerk invitation failed (practice still created):", e)
          }
        }

        return c.json({ organization })
      } catch (error) {
        console.error("Error creating practice:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to create practice" })
      }
    }),

  // Organization Admin Routes
  getOrganizationUsers: orgAdminOnly
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional()
    }))
    .query(async ({ c, ctx, input }) => {
      try {
        const organizationId = requireActiveOrganizationId(ctx.user)
        const skip = (input.page - 1) * input.limit
        const where: {
          organizationId: string
          isActive?: boolean
          role?: 'OWNER' | 'ADMIN' | 'MEMBER'
          user?: { email: { contains: string; mode: 'insensitive' } }
        } = { organizationId, isActive: true }

        if (input.search) {
          where.user = {
            email: { contains: input.search, mode: 'insensitive' },
          }
        }

        if (input.role) {
          where.role = input.role
        }

        const [memberships, total] = await Promise.all([
          db.userOrganization.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  createdAt: true,
                  externalId: true,
                },
              },
            },
            skip,
            take: input.limit,
            orderBy: { joinedAt: 'desc' },
          }),
          db.userOrganization.count({ where }),
        ])

        const users = memberships.map((m) => ({
          id: m.user.id,
          email: m.user.email,
          organizationRole: m.role,
          joinedAt: m.joinedAt,
          membershipActive: m.isActive,
          hasSignedIn: Boolean(m.user.externalId),
        }))

        return c.json({
          users,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit)
        })
      } catch (error) {
        console.error("Error fetching organization users:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to fetch users" })
      }
    }),

  inviteUser: orgAdminOnly
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'MEMBER'])
    }))
    .mutation(async ({ c, ctx, input }) => {
      try {
        const organizationId = requireActiveOrganizationId(ctx.user)
        // Check if user already exists in this organization
        const existingUserOrg = await db.userOrganization.findFirst({
          where: {
            organizationId,
            user: {
              email: {
                equals: normalizeEmail(input.email),
                mode: "insensitive",
              },
            },
          },
        })

        if (existingUserOrg) {
          throw new HTTPException(400, { message: "User already exists in this organization" })
        }

        const user = await findOrCreatePendingUserByEmail(input.email)

        // Add user to organization
        const userOrg = await db.userOrganization.create({
          data: {
            userId: user.id,
            organizationId,
            role: input.role,
            isActive: true,
          }
        })

        try {
          await sendClerkInvitation(normalizeEmail(input.email))
        } catch (e) {
          console.error("Clerk invitation failed (membership still created):", e)
        }

        return c.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: userOrg.role,
            joinedAt: userOrg.joinedAt,
            isActive: userOrg.isActive
          }
        })
      } catch (error) {
        console.error("Error inviting user:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to invite user" })
      }
    }),

  updateUserRole: orgAdminOnly
    .input(z.object({
      userId: z.string(),
      role: z.enum(['ADMIN', 'MEMBER'])
    }))
    .mutation(async ({ c, ctx, input }) => {
      try {
        const organizationId = requireActiveOrganizationId(ctx.user)
        // Verify user belongs to the same organization
        const userOrg = await db.userOrganization.findFirst({
          where: { 
            userId: input.userId,
            organizationId,
          }
        })

        if (!userOrg) {
          throw new HTTPException(404, { message: "User not found in organization" })
        }

        // Update user role
        const updatedUserOrg = await db.userOrganization.update({
          where: { id: userOrg.id },
          data: { role: input.role }
        })

        return c.json({ success: true, userOrg: updatedUserOrg })
      } catch (error) {
        console.error("Error updating user role:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to update user role" })
      }
    }),

  deactivateUser: orgAdminOnly
    .input(z.object({
      userId: z.string()
    }))
    .mutation(async ({ c, ctx, input }) => {
      try {
        const organizationId = requireActiveOrganizationId(ctx.user)
        // Verify user belongs to the same organization
        const userOrg = await db.userOrganization.findFirst({
          where: { 
            userId: input.userId,
            organizationId,
          }
        })

        if (!userOrg) {
          throw new HTTPException(404, { message: "User not found in organization" })
        }

        // Prevent deactivating self
        if (input.userId === ctx.user.id) {
          throw new HTTPException(400, { message: "Cannot deactivate your own account" })
        }

        const updatedUserOrg = await db.userOrganization.update({
          where: { id: userOrg.id },
          data: { isActive: false }
        })

        return c.json({ success: true, userOrg: updatedUserOrg })
      } catch (error) {
        console.error("Error deactivating user:", error)
        if (error instanceof HTTPException) throw error
        throw new HTTPException(500, { message: "Failed to deactivate user" })
      }
    }),

  // Audit Logging
  getAuditLogs: privateProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      userId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ c, ctx, input }) => {
      try {
        const organizationId = requireActiveOrganizationId(ctx.user)
        const skip = (input.page - 1) * input.limit
        const where: { organizationId: string } & Record<string, unknown> = { organizationId }
        
        if (input.userId) {
          where.userId = input.userId
        }
        
        if (input.action) {
          where.action = input.action
        }
        
        if (input.startDate || input.endDate) {
          where.createdAt = {}
          if (input.startDate) where.createdAt.gte = new Date(input.startDate)
          if (input.endDate) where.createdAt.lte = new Date(input.endDate)
        }

        // For now, return empty audit logs since we don't have the AuditLog model yet
        return c.json({
          logs: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          totalPages: 0
        })
      } catch (error) {
        console.error("Error fetching audit logs:", error)
        throw new HTTPException(500, { message: "Failed to fetch audit logs" })
      }
    })
})
