# Fix: "column user_id of relation notifications does not exist"

This error occurs when your code is trying to add a task but the database has a schema mismatch. The notifications table uses `user_email` instead of `user_id`.

## Quick Fix (Recommended)

### Step 1: Run the database migrations
Go to **Supabase Dashboard > SQL Editor**, then run:

1. **First**, run `supabase-fix-notifications-schema.sql`:
   - This drops problematic columns and recreates RLS policies
   - Ensures user_email is the primary identifier

2. **Second**, run `supabase-fix-projects-schema.sql`:
   - Fixes the projects table structure
   - Ensures compatibility with Phase 2 migration

### Step 2: Rebuild your app
```bash
npm run build
```

### Step 3: Clear browser data and refresh
- Clear browser cache, cookies, and local storage
- Refresh your app (Ctrl+Shift+Delete on Windows)

## Manual Fix (If scripts don't work)

If you can't use the SQL files, run these commands directly in Supabase SQL Editor:

```sql
-- 1. Fix notifications table
ALTER TABLE IF EXISTS public.notifications 
  DROP COLUMN IF EXISTS user_id CASCADE;

ALTER TABLE IF EXISTS public.notifications
  ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '';

-- 2. Fix projects table - remove old singular bid_id if it exists
ALTER TABLE IF EXISTS public.projects 
  DROP COLUMN IF EXISTS bid_id CASCADE;

-- 3. Verify the schemas
SELECT 'notifications',  column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

SELECT 'projects', column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
```

## Why This Happened

- The notifications table was changed from using `user_id` (UUID) to `user_email` (TEXT)
- Your codebase was updated, but the database might still have old triggers or policies referencing the old column name
- The projects table may have both singular `bid_id` and plural `bid_ids` columns from incomplete Phase 2 migration

## If You Still Get Errors

1. Check your browser console for the exact error
2. Make sure all three SQL migration files ran successfully:
   - supabase-setup-notifications.sql (columns should be: id, user_email, type, title, message, tender_id, project_id, is_read, created_at)
   - supabase-setup-projects-tasks.sql (projects table should NOT have a bid_id column)
   - supabase-fix-notifications-schema.sql
   - supabase-fix-projects-schema.sql

3. Verify no `user_id` column exists in notifications table:
   ```sql
   DESCRIBE public.notifications; -- or use DESC
   ```

## Help

If the issue persists:
1. Check the exact error message in browser console
2. Verify your Supabase database URL and credentials are correct
3. Check Row Level Security (RLS) policies on notifications table aren't conflicting

