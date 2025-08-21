-- Add isSuperAdmin field to User table
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Optionally, set specific users as super admins
-- UPDATE "User" SET "isSuperAdmin" = true WHERE email = 'nick@peppersatlas.com'; 