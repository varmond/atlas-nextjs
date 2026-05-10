#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupUserOrganization(email: string, organizationName: string) {
  console.log(`🔧 Setting up organization for ${email}...`)
  console.log(`Organization: ${organizationName}`)
  console.log('')

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userOrganizations: {
          include: {
            organization: true
          }
        }
      }
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      return
    }

    console.log(`✅ Found user: ${user.email}`)
    console.log(`   Super Admin: ${user.isSuperAdmin ? 'Yes' : 'No'}`)
    console.log(`   Current Organizations: ${user.userOrganizations.length}`)

    // Check if organization already exists
    let organization = await prisma.organization.findFirst({
      where: { name: organizationName }
    })

    if (!organization) {
      console.log('🏢 Creating organization...')
      
      organization = await prisma.organization.create({
        data: {
          name: organizationName,
          subscriptionStatus: 'ACTIVE',
          planType: 'PROFESSIONAL',
        }
      })
      
      console.log('✅ Organization created')
    } else {
      console.log('✅ Organization already exists')
    }

    // Check if user is already linked to this organization
    const existingUserOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id
        }
      }
    })

    if (!existingUserOrg) {
      console.log('🔗 Linking user to organization as OWNER...')
      
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'OWNER',
          isActive: true,
        }
      })
      
      console.log('✅ User linked to organization as OWNER')
    } else {
      console.log('✅ User already linked to organization')
      
      // Ensure role is OWNER
      if (existingUserOrg.role !== 'OWNER') {
        await prisma.userOrganization.update({
          where: { id: existingUserOrg.id },
          data: { role: 'OWNER' }
        })
        console.log('✅ Updated role to OWNER')
      }
    }

    // Set current organization for user
    await prisma.user.update({
      where: { id: user.id },
      data: { currentOrganizationId: organization.id }
    })

    console.log('✅ Set as current organization')

    // Create default location for organization
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
          userId: user.id,
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
    console.log(`   User: ${user.email}`)
    console.log(`   Organization: ${organization.name}`)
    console.log(`   Organization ID: ${organization.id}`)
    console.log(`   Role: OWNER`)
    console.log('')
    console.log('🔗 You can now:')
    console.log('   1. Access user management at /dashboard/users')
    console.log('   2. Access admin panel at /dashboard/admin')
    console.log('   3. Manage your organization')

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
Usage: npm run setup-user-organization <email> <organization-name>

Examples:
  npm run setup-user-organization nredd257@gmail.com "PeppersAtlas Inc"
  npm run setup-user-organization user@example.com "My Company"

This will:
1. Find the user by email
2. Create an organization (or use existing)
3. Link user to organization as OWNER
4. Set as current organization
5. Create default location
`)
    process.exit(1)
  }

  const [email, organizationName] = args

  await setupUserOrganization(email, organizationName)
}

if (require.main === module) {
  main().catch(console.error)
}

export { setupUserOrganization }
