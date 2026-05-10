#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SetupOptions {
  superAdminEmail: string
  organizationName: string
  organizationEmail?: string
}

async function setupStandardUser(options: SetupOptions) {
  const { superAdminEmail, organizationName, organizationEmail } = options

  console.log('🚀 Setting up standard user structure...')
  console.log(`Super Admin Email: ${superAdminEmail}`)
  console.log(`Organization Name: ${organizationName}`)
  console.log('')

  try {
    // Step 1: Check if super admin user exists
    let superAdminUser = await prisma.user.findUnique({
      where: { email: superAdminEmail },
      include: {
        userOrganizations: {
          include: {
            organization: true
          }
        }
      }
    })

    if (!superAdminUser) {
      console.log('📝 Creating super admin user...')
      
      // Create super admin user
      superAdminUser = await prisma.user.create({
        data: {
          email: superAdminEmail,
          quotaLimit: 1000,
          plan: 'PRO',
          isSuperAdmin: true,
          apiKey: `sk_${Math.random().toString(36).substring(2, 15)}`,
        },
        include: {
          userOrganizations: {
            include: {
              organization: true
            }
          }
        }
      })
      
      console.log('✅ Super admin user created')
    } else {
      console.log('✅ Super admin user already exists')
      
      // Update to ensure super admin status
      if (!superAdminUser.isSuperAdmin) {
        await prisma.user.update({
          where: { id: superAdminUser.id },
          data: { isSuperAdmin: true }
        })
        console.log('✅ Updated user to super admin status')
      }
    }

    // Step 2: Check if organization exists
    let organization = await prisma.organization.findFirst({
      where: { name: organizationName },
      include: {
        userOrganizations: {
          include: {
            user: true
          }
        }
      }
    })

    if (!organization) {
      console.log('🏢 Creating organization...')
      
      // Create organization
      organization = await prisma.organization.create({
        data: {
          name: organizationName,
          subscriptionStatus: 'ACTIVE',
          planType: 'PROFESSIONAL',
        },
        include: {
          userOrganizations: {
            include: {
              user: true
            }
          }
        }
      })
      
      console.log('✅ Organization created')
    } else {
      console.log('✅ Organization already exists')
    }

    // Step 3: Link super admin to organization as OWNER
    const existingUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: superAdminUser.id,
          organizationId: organization.id
        }
      }
    })

    if (!existingUserOrg) {
      console.log('🔗 Linking super admin to organization as OWNER...')
      
      await prisma.userOrganization.create({
        data: {
          userId: superAdminUser.id,
          organizationId: organization.id,
          role: 'OWNER',
          isActive: true,
        }
      })
      
      console.log('✅ Super admin linked to organization as OWNER')
    } else {
      console.log('✅ Super admin already linked to organization')
      
      // Ensure role is OWNER
      if (existingUserOrg.role !== 'OWNER') {
        await prisma.userOrganization.update({
          where: { id: existingUserOrg.id },
          data: { role: 'OWNER' }
        })
        console.log('✅ Updated role to OWNER')
      }
    }

    // Step 4: Set current organization for super admin
    await prisma.user.update({
      where: { id: superAdminUser.id },
      data: { currentOrganizationId: organization.id }
    })

    // Step 5: Create organization email user if provided
    if (organizationEmail && organizationEmail !== superAdminEmail) {
      console.log(`👤 Creating organization user: ${organizationEmail}`)
      
      let orgUser = await prisma.user.findUnique({
        where: { email: organizationEmail }
      })

      if (!orgUser) {
        orgUser = await prisma.user.create({
          data: {
            email: organizationEmail,
            quotaLimit: 100,
            plan: 'FREE',
            isSuperAdmin: false,
            apiKey: `sk_${Math.random().toString(36).substring(2, 15)}`,
          }
        })
        console.log('✅ Organization user created')
      } else {
        console.log('✅ Organization user already exists')
      }

      // Link organization user to organization as ADMIN
      const orgUserOrg = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: orgUser.id,
            organizationId: organization.id
          }
        }
      })

      if (!orgUserOrg) {
        await prisma.userOrganization.create({
          data: {
            userId: orgUser.id,
            organizationId: organization.id,
            role: 'ADMIN',
            isActive: true,
          }
        })
        console.log('✅ Organization user linked as ADMIN')
      }
    }

    // Step 6: Create default location for organization
    const defaultLocation = await prisma.location.findFirst({
      where: {
        organizationId: organization.id,
        name: 'Main Location'
      }
    })

    if (!defaultLocation) {
      console.log('📍 Creating default location...')
      
      await prisma.location.create({
        data: {
          name: 'Main Location',
          description: 'Primary location for inventory management',
          isActive: true,
          organizationId: organization.id,
          userId: superAdminUser.id,
        }
      })
      
      console.log('✅ Default location created')
    } else {
      console.log('✅ Default location already exists')
    }

    console.log('')
    console.log('🎉 Setup completed successfully!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   Super Admin: ${superAdminUser.email}`)
    console.log(`   Organization: ${organization.name}`)
    console.log(`   Organization ID: ${organization.id}`)
    console.log('')
    console.log('🔗 Next Steps:')
    console.log('   1. Log in with your super admin email')
    console.log('   2. Access admin panel at /dashboard/admin')
    console.log('   3. Create additional users for your organization')
    console.log('   4. Set up your inventory management workflow')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log(`
Usage: npm run setup-standard-user <super-admin-email> <organization-name> [organization-email]

Examples:
  npm run setup-standard-user nick@peppersatlas.com "PeppersAtlas Inc"
  npm run setup-standard-user nick@peppersatlas.com "My Company" admin@mycompany.com

This will:
1. Create a super admin user (or update existing)
2. Create an organization (or use existing)
3. Link super admin to organization as OWNER
4. Create organization user as ADMIN (if email provided)
5. Create default location
`)
    process.exit(1)
  }

  const [superAdminEmail, organizationName, organizationEmail] = args

  await setupStandardUser({
    superAdminEmail,
    organizationName,
    organizationEmail
  })
}

if (require.main === module) {
  main().catch(console.error)
}

export { setupStandardUser }
