#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner for JStack Application
 * 
 * This script provides a unified way to run all types of tests:
 * - Unit tests (Vitest)
 * - Integration tests (Vitest)
 * - E2E tests (Playwright)
 * - Coverage reports
 * 
 * Usage:
 *   npm run test:all
 *   npm run test:unit
 *   npm run test:integration
 *   npm run test:e2e
 *   npm run test:coverage
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command: string, description: string): boolean {
  log(`\n${colors.bright}${colors.blue}Running: ${description}${colors.reset}`)
  log(`${colors.cyan}Command: ${command}${colors.reset}\n`)
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    log(`\n${colors.green}✅ ${description} completed successfully${colors.reset}`)
    return true
  } catch (error) {
    log(`\n${colors.red}❌ ${description} failed${colors.reset}`)
    return false
  }
}

function checkPrerequisites(): boolean {
  log(`${colors.bright}${colors.blue}Checking prerequisites...${colors.reset}`)
  
  const checks = [
    {
      name: 'Node.js',
      check: () => {
        try {
          const version = execSync('node --version', { encoding: 'utf8' }).trim()
          log(`  ✅ Node.js: ${version}`)
          return true
        } catch {
          log(`  ❌ Node.js not found`, 'red')
          return false
        }
      }
    },
    {
      name: 'npm',
      check: () => {
        try {
          const version = execSync('npm --version', { encoding: 'utf8' }).trim()
          log(`  ✅ npm: ${version}`)
          return true
        } catch {
          log(`  ❌ npm not found`, 'red')
          return false
        }
      }
    },
    {
      name: 'Vitest',
      check: () => {
        try {
          execSync('npx vitest --version', { encoding: 'utf8' })
          log(`  ✅ Vitest: Available`)
          return true
        } catch {
          log(`  ❌ Vitest not found`, 'red')
          return false
        }
      }
    },
    {
      name: 'Playwright',
      check: () => {
        try {
          execSync('npx playwright --version', { encoding: 'utf8' })
          log(`  ✅ Playwright: Available`)
          return true
        } catch {
          log(`  ❌ Playwright not found`, 'red')
          return false
        }
      }
    },
    {
      name: 'Test files',
      check: () => {
        const testDirs = [
          'src/test/unit',
          'src/test/integration',
          'src/test/e2e'
        ]
        
        let allExist = true
        testDirs.forEach(dir => {
          if (existsSync(dir)) {
            log(`  ✅ ${dir}: Found`)
          } else {
            log(`  ❌ ${dir}: Not found`, 'red')
            allExist = false
          }
        })
        
        return allExist
      }
    }
  ]
  
  const results = checks.map(check => check.check())
  const allPassed = results.every(result => result)
  
  if (allPassed) {
    log(`\n${colors.green}✅ All prerequisites met${colors.reset}`)
  } else {
    log(`\n${colors.red}❌ Some prerequisites are missing${colors.reset}`)
  }
  
  return allPassed
}

function runUnitTests(): boolean {
  return runCommand(
    'npx vitest run src/test/unit --reporter=verbose',
    'Unit Tests'
  )
}

function runIntegrationTests(): boolean {
  return runCommand(
    'npx vitest run src/test/integration --reporter=verbose',
    'Integration Tests'
  )
}

function runE2ETests(): boolean {
  return runCommand(
    'npx playwright test',
    'E2E Tests'
  )
}

function runAllTests(): boolean {
  log(`${colors.bright}${colors.magenta}🚀 Running All Tests${colors.reset}`)
  
  const results = [
    runUnitTests(),
    runIntegrationTests(),
    runE2ETests()
  ]
  
  const allPassed = results.every(result => result)
  
  if (allPassed) {
    log(`\n${colors.bright}${colors.green}🎉 All tests passed!${colors.reset}`)
  } else {
    log(`\n${colors.bright}${colors.red}💥 Some tests failed${colors.reset}`)
  }
  
  return allPassed
}

function runCoverage(): boolean {
  return runCommand(
    'npx vitest run --coverage',
    'Coverage Report'
  )
}

function runTestsWithWatch(): boolean {
  return runCommand(
    'npx vitest --watch',
    'Tests with Watch Mode'
  )
}

function runE2EWithUI(): boolean {
  return runCommand(
    'npx playwright test --ui',
    'E2E Tests with UI'
  )
}

function showHelp(): void {
  log(`${colors.bright}${colors.blue}JStack Test Runner${colors.reset}`)
  log(`\nAvailable commands:`)
  log(`  ${colors.cyan}all${colors.reset}        - Run all tests (unit, integration, e2e)`)
  log(`  ${colors.cyan}unit${colors.reset}       - Run unit tests only`)
  log(`  ${colors.cyan}integration${colors.reset} - Run integration tests only`)
  log(`  ${colors.cyan}e2e${colors.reset}        - Run E2E tests only`)
  log(`  ${colors.cyan}coverage${colors.reset}   - Run tests with coverage report`)
  log(`  ${colors.cyan}watch${colors.reset}      - Run tests in watch mode`)
  log(`  ${colors.cyan}e2e-ui${colors.reset}     - Run E2E tests with UI`)
  log(`  ${colors.cyan}check${colors.reset}      - Check prerequisites`)
  log(`  ${colors.cyan}help${colors.reset}       - Show this help message`)
  log(`\nUsage:`)
  log(`  npm run test:all`)
  log(`  npm run test:unit`)
  log(`  npm run test:integration`)
  log(`  npm run test:e2e`)
  log(`  npm run test:coverage`)
  log(`  npm run test:watch`)
  log(`  npm run test:e2e-ui`)
}

function main(): void {
  const command = process.argv[2] || 'help'
  
  switch (command) {
    case 'all':
      if (checkPrerequisites()) {
        runAllTests()
      }
      break
    case 'unit':
      if (checkPrerequisites()) {
        runUnitTests()
      }
      break
    case 'integration':
      if (checkPrerequisites()) {
        runIntegrationTests()
      }
      break
    case 'e2e':
      if (checkPrerequisites()) {
        runE2ETests()
      }
      break
    case 'coverage':
      if (checkPrerequisites()) {
        runCoverage()
      }
      break
    case 'watch':
      if (checkPrerequisites()) {
        runTestsWithWatch()
      }
      break
    case 'e2e-ui':
      if (checkPrerequisites()) {
        runE2EWithUI()
      }
      break
    case 'check':
      checkPrerequisites()
      break
    case 'help':
    default:
      showHelp()
      break
  }
}

if (require.main === module) {
  main()
}
