import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupAdminUser() {
  try {
    console.log('Setting up admin user and organization...')
    
    // Create organization first
    const organization = await prisma.organization.create({
      data: {
        name: "Pepper's Atlas Organization",
        subscriptionStatus: 'ACTIVE',
        planType: 'PROFESSIONAL',
        settings: {
          features: ['admin_access', 'audit_logs', 'support_access']
        }
      }
    })
    
    console.log('✅ Created organization:', organization.name)
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'nick@peppersatlas.com',
        quotaLimit: 10000,
        plan: 'PRO',
        isSuperAdmin: true,
        supportTier: 'FULL',
        currentOrganizationId: organization.id,
        organizationId: organization.id, // Legacy field
        role: 'OWNER',
        apiKey: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })
    
    console.log('✅ Created admin user:', user.email)
    
    // Create UserOrganization relationship
    const userOrg = await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
        isActive: true
      }
    })
    
    console.log('✅ Created user-organization relationship')
    
    // Create some sample data for testing
    const location = await prisma.location.create({
      data: {
        name: 'Main Location',
        description: 'Primary location for inventory',
        organizationId: organization.id,
        userId: user.id
      }
    })
    
    console.log('✅ Created sample location:', location.name)
    
    // Create a sample patient for testing
    const patient = await prisma.patient.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        organizationId: organization.id
      }
    })
    
    console.log('✅ Created sample patient:', `${patient.firstName} ${patient.lastName}`)
    
    console.log('\n🎉 Setup complete!')
    console.log('Organization ID:', organization.id)
    console.log('User ID:', user.id)
    console.log('API Key:', user.apiKey)
    console.log('\nYou can now log in with your email and access the admin dashboard.')
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdminUser()
