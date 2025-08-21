#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const command = process.argv[2]
  const email = process.argv[3]

  if (!command) {
    console.log(`
Usage: npm run manage-super-admin <command> [email]

Commands:
  add <email>     - Grant super admin privileges to a user
  remove <email>  - Remove super admin privileges from a user
  list            - List all super admins
  check <email>   - Check if a user is a super admin

Examples:
  npm run manage-super-admin add nick@peppersatlas.com
  npm run manage-super-admin remove user@example.com
  npm run manage-super-admin list
  npm run manage-super-admin check nick@peppersatlas.com
`)
    process.exit(1)
  }

  try {
    switch (command) {
      case 'add':
        if (!email) {
          console.error('Email is required for add command')
          process.exit(1)
        }
        await addSuperAdmin(email)
        break
      case 'remove':
        if (!email) {
          console.error('Email is required for remove command')
          process.exit(1)
        }
        await removeSuperAdmin(email)
        break
      case 'list':
        await listSuperAdmins()
        break
      case 'check':
        if (!email) {
          console.error('Email is required for check command')
          process.exit(1)
        }
        await checkSuperAdmin(email)
        break
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function addSuperAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`User with email ${email} not found`)
    process.exit(1)
  }

  // Use raw SQL to update the isSuperAdmin field
  await prisma.$executeRaw`
    UPDATE "User" 
    SET "isSuperAdmin" = true 
    WHERE email = ${email}
  `

  console.log(`✅ Granted super admin privileges to ${email}`)
}

async function removeSuperAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`User with email ${email} not found`)
    process.exit(1)
  }

  // Use raw SQL to update the isSuperAdmin field
  await prisma.$executeRaw`
    UPDATE "User" 
    SET "isSuperAdmin" = false 
    WHERE email = ${email}
  `

  console.log(`✅ Removed super admin privileges from ${email}`)
}

async function listSuperAdmins() {
  // Use raw SQL to query super admins
  const superAdmins = await prisma.$queryRaw<Array<{
    email: string
    role: string
    createdAt: Date
  }>>`
    SELECT email, role, "createdAt"
    FROM "User" 
    WHERE "isSuperAdmin" = true
    ORDER BY "createdAt" DESC
  `

  if (superAdmins.length === 0) {
    console.log('No super admins found')
    return
  }

  console.log('\nSuper Admins:')
  console.log('==============')
  superAdmins.forEach(admin => {
    console.log(`• ${admin.email} (${admin.role}) - Created: ${admin.createdAt.toLocaleDateString()}`)
  })
  console.log()
}

async function checkSuperAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`User with email ${email} not found`)
    process.exit(1)
  }

  // Use raw SQL to check isSuperAdmin status
  const result = await prisma.$queryRaw<Array<{ isSuperAdmin: boolean }>>`
    SELECT "isSuperAdmin"
    FROM "User" 
    WHERE email = ${email}
  `

  const isSuperAdmin = result[0]?.isSuperAdmin || false
  console.log(`${email} is ${isSuperAdmin ? '✅ a super admin' : '❌ not a super admin'}`)
}

main() 