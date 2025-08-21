# Super Admin Management

This document explains how to manage super admin privileges in the PeppersAtlas system.

## Overview

Super admins have the ability to:
- Create and manage organizations
- Add/remove users from organizations
- Access the admin panel at `/dashboard/admin/organizations`
- View all organizations and their members

## Managing Super Admins

### Using the Management Script

We've created a script-based approach for managing super admins that doesn't require hardcoding or environment variables.

#### Available Commands

```bash
# Add a super admin
npm run manage-super-admin add user@example.com

# Remove super admin privileges
npm run manage-super-admin remove user@example.com

# List all super admins
npm run manage-super-admin list

# Check if a user is a super admin
npm run manage-super-admin check user@example.com
```

#### Examples

```bash
# Grant super admin privileges to your email
npm run manage-super-admin add nick@peppersatlas.com

# Check current super admins
npm run manage-super-admin list

# Remove super admin from someone
npm run manage-super-admin remove user@example.com
```

## How It Works

### Database Storage
- Super admin status is stored in the `isSuperAdmin` boolean field in the `User` table
- This provides persistent storage that survives deployments

### Fallback Mechanisms
The system has multiple fallback mechanisms for super admin access:

1. **Database Field** (Primary): `isSuperAdmin` field in the User table
2. **Default Emails** (Backup): Hardcoded list in `src/lib/super-admin.ts`
3. **Environment Variable** (Emergency): `SUPER_ADMIN_EMAILS` env var
4. **Owner Role** (Legacy): Users with `OWNER` role (can be removed later)

### Security
- Only super admins can access the admin panel
- API endpoints check super admin status before allowing admin operations
- The system logs access attempts for security monitoring

## Adding New Super Admins

1. **For your team members:**
   ```bash
   npm run manage-super-admin add teammember@yourcompany.com
   ```

2. **For emergency access:**
   - Set the `SUPER_ADMIN_EMAILS` environment variable
   - Format: `SUPER_ADMIN_EMAILS=email1@example.com,email2@example.com`

3. **For temporary access:**
   - Use the script to add/remove as needed
   - Remove access when no longer needed

## Best Practices

1. **Limit super admin access** - Only grant to trusted team members
2. **Regular audits** - Use `npm run manage-super-admin list` to review access
3. **Remove access promptly** - When team members leave or roles change
4. **Use environment variables sparingly** - Prefer the database approach for better audit trails

## Troubleshooting

### "Access Denied" Errors
- Check if the user is a super admin: `npm run manage-super-admin check user@example.com`
- Verify the user exists in the database
- Check the browser console for detailed error messages

### Database Issues
- If the `isSuperAdmin` field doesn't exist, run the database migration
- If the script fails, check the database connection

### Emergency Access
If you lose all super admin access:
1. Set the `SUPER_ADMIN_EMAILS` environment variable with your email
2. Restart the application
3. Use the script to add yourself back to the database
4. Remove the environment variable

## API Endpoints

Super admin protected endpoints:
- `GET /api/organization/getAllOrganizations`
- `POST /api/organization/createOrganization`
- `POST /api/organization/addUserToOrganization`
- `GET /api/organization/getOrganizationMembers`

All these endpoints check super admin status before allowing access. 