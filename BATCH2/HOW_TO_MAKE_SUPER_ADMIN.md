# How to Create a Super Admin Account

## What is a Super Admin?

A **Super Admin** has system-wide access to:
- View ALL tenants across the entire system
- Edit any tenant's details (subscription, limits, status)
- Delete tenants
- View ALL users across ALL tenants
- Edit or delete any user account
- Access the Global Admin Dashboard at `/global-admin`

## Creating Your First Super Admin

### Option 1: Convert an Existing User to Super Admin

1. **Go to your Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run this SQL command** (replace the email with your account email):

```sql
UPDATE users
SET role = 'super_admin',
    tenant_id = NULL
WHERE email = 'your-email@example.com';
```

**Important Notes:**
- Replace `'your-email@example.com'` with the actual email of the user you want to make a super admin
- Setting `tenant_id = NULL` makes the account system-level (not tied to any specific tenant)
- The user must already exist in the `users` table (they must have signed up first)

### Option 2: Create a New Super Admin from Scratch

1. **First, create a Supabase auth account:**
   - Go to your Supabase Dashboard → Authentication → Users
   - Click "Add User"
   - Enter email and password
   - Copy the User ID (UUID) that was created

2. **Then, create the user record in the database:**

```sql
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  tenant_id,
  is_active,
  email_verified
)
VALUES (
  'paste-the-user-id-here',  -- UUID from Supabase Auth
  'admin@yourdomain.com',     -- Email address
  'System Administrator',      -- Full name
  'super_admin',              -- Role (CRITICAL!)
  NULL,                       -- No tenant (system-level)
  true,                       -- Active
  true                        -- Email verified
);
```

## Verifying Super Admin Access

After creating the super admin:

1. **Log out** of your current session
2. **Log in** with the super admin email/password
3. You should see:
   - A red "Global Admin" menu item in the sidebar
   - Access to the Global Admin Dashboard
   - Ability to view and manage all tenants and users

## Security Best Practices

1. **Limit Super Admins**: Only create super admin accounts for people who truly need system-wide access
2. **Use Strong Passwords**: Super admins have full system access - use very strong passwords
3. **Audit Regularly**: Monitor super admin activity through your Supabase logs
4. **Never Share Credentials**: Each super admin should have their own account

## Removing Super Admin Access

To convert a super admin back to a regular user:

```sql
UPDATE users
SET role = 'owner',  -- or 'admin', 'manager', etc.
    tenant_id = 'tenant-uuid-here'  -- assign them to a tenant
WHERE email = 'former-superadmin@example.com';
```

## Finding All Super Admins

To see all current super admins:

```sql
SELECT id, email, full_name, role, is_active, created_at
FROM users
WHERE role = 'super_admin'
ORDER BY created_at DESC;
```

## Troubleshooting

**Problem: Can't see Global Admin menu**
- Solution: Make sure `role = 'super_admin'` (exactly, case-sensitive)
- Solution: Log out and log back in to refresh permissions

**Problem: Getting permission errors**
- Solution: Verify the RLS policies were created correctly
- Solution: Check that you're logged in with the super admin account

**Problem: Super admin can't access data**
- Solution: Make sure the migration `add_global_admin_system.sql` was applied
- Solution: Check Supabase logs for RLS policy errors
