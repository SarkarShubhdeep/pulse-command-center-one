# Supabase Users Table Setup Guide

This guide walks you through creating the `public.users` table in Supabase and syncing existing auth users.

## Step 1: Create the Public Users Table

Go to your Supabase dashboard and open the **SQL Editor**. Run the following SQL to create the `public.users` table:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create an index on email for faster lookups
CREATE INDEX idx_users_email ON public.users(email);

-- Create an index on is_online for filtering online users
CREATE INDEX idx_users_is_online ON public.users(is_online);
```

## Step 2: Enable Row Level Security (RLS)

Enable RLS on the users table:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## Step 3: Create RLS Policies

Create policies to allow users to view all users but only update their own profile:

```sql
-- Allow authenticated users to read all users
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Step 4: Sync Existing Auth Users

If you already have users in `auth.users`, sync them to the `public.users` table:

```sql
-- Insert existing auth users into public.users
INSERT INTO public.users (id, email, full_name, is_online, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  FALSE,
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

## Step 5: Create a Trigger for Auto-Sync on Auth User Creation

Create a trigger to automatically add new auth users to the `public.users` table:

```sql
-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_online, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', public.users.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 6: Create an Update Trigger for Timestamps

Create a trigger to automatically update the `updated_at` timestamp:

```sql
-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

## Step 7: Verify the Setup

Run these queries to verify everything is working:

```sql
-- Check the users table structure
SELECT * FROM public.users;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## Step 8: Update User Profile (Optional)

To update a user's profile from your application, use the Supabase client:

```typescript
const supabase = createClient();

// Update user profile
const { data, error } = await supabase
    .from("users")
    .update({
        full_name: "New Name",
        is_online: true,
        role: "admin",
    })
    .eq("id", userId);
```

## Troubleshooting

**Issue: Foreign key constraint error**

-   Make sure the user exists in `auth.users` before inserting into `public.users`
-   The `ON DELETE CASCADE` will automatically remove the user from `public.users` if deleted from `auth.users`

**Issue: RLS blocking reads**

-   Make sure you're authenticated when querying
-   Check that the RLS policies are correctly created

**Issue: Trigger not firing**

-   Verify the trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
-   Check the function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

## Summary

Your `public.users` table now:

-   ✅ Has a foreign key relationship with `auth.users`
-   ✅ Stores user metadata (full_name, role, online status)
-   ✅ Has RLS policies for security
-   ✅ Auto-syncs new auth users
-   ✅ Auto-updates timestamps
-   ✅ Includes existing auth users
