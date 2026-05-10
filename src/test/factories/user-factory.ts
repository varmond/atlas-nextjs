export interface UserFactoryOptions {
  id?: string
  externalId?: string
  email?: string
  firstName?: string
  lastName?: string
  organizationId?: string
  isSuperAdmin?: boolean
  supportTier?: string
}

export const createUserData = (overrides: UserFactoryOptions = {}) => ({
  id: 'user_123',
  externalId: 'clerk_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  organizationId: 'org_123',
  isSuperAdmin: false,
  supportTier: 'NONE',
  ...overrides,
})

export const createSuperAdminUser = (overrides: UserFactoryOptions = {}) => 
  createUserData({
    isSuperAdmin: true,
    supportTier: 'FULL',
    ...overrides,
  })

export const createUserWithoutOrganization = (overrides: UserFactoryOptions = {}) =>
  createUserData({
    organizationId: null,
    ...overrides,
  })
