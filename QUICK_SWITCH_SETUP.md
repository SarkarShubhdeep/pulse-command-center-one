# Quick Switch PIN Setup Guide

This guide walks you through adding the quick switch PIN functionality to the `public.users` table.

## Step 1: Add PIN Columns to Users Table

Run the following SQL in your Supabase SQL Editor to add the quick switch PIN columns:

```sql
-- Add quick switch PIN columns to users table
ALTER TABLE public.users
ADD COLUMN quick_switch_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN quick_switch_pin TEXT;

-- Create an index for quick switch enabled users (for faster lookups during switch)
CREATE INDEX idx_users_quick_switch_enabled ON public.users(quick_switch_enabled) WHERE quick_switch_enabled = TRUE;
```

## Step 2: Update RLS Policies

The existing RLS policies should already cover the new columns since they apply to the entire row. However, ensure users can only update their own PIN:

```sql
-- The existing "Users can update their own profile" policy already covers this
-- But if you want to be explicit about PIN updates:

-- Optional: Create a specific policy for PIN updates (not required if general update policy exists)
-- CREATE POLICY "Users can update their own PIN"
--   ON public.users
--   FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);
```

## Step 3: Create PIN Hashing Function (Recommended for Security)

For better security, store hashed PINs instead of plain text:

```sql
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to hash PINs
CREATE OR REPLACE FUNCTION public.hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify PINs
CREATE OR REPLACE FUNCTION public.verify_pin(user_id UUID, pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT quick_switch_pin INTO stored_pin
  FROM public.users
  WHERE id = user_id AND quick_switch_enabled = TRUE;

  IF stored_pin IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN stored_pin = crypt(pin, stored_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 4: Verify the Setup

Run these queries to verify the columns were added:

```sql
-- Check the updated users table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';

-- Test the new columns
SELECT id, email, quick_switch_enabled, quick_switch_pin IS NOT NULL as has_pin
FROM public.users
LIMIT 5;
```

## Summary

Your `public.users` table now includes:

-   ✅ `quick_switch_enabled` - Boolean flag to enable/disable quick switch
-   ✅ `quick_switch_pin` - Hashed 4-6 digit PIN for quick authentication
-   ✅ PIN hashing functions for security
-   ✅ PIN verification function for authentication

## Usage Notes

1. **Setting a PIN**: When a user enables quick switch, hash their PIN before storing:

    ```sql
    UPDATE public.users
    SET quick_switch_enabled = TRUE,
        quick_switch_pin = public.hash_pin('1234')
    WHERE id = 'user-uuid';
    ```

2. **Verifying a PIN**: Use the verify function:

    ```sql
    SELECT public.verify_pin('user-uuid', '1234');
    ```

3. **Disabling Quick Switch**: Set enabled to false and clear the PIN:
    ```sql
    UPDATE public.users
    SET quick_switch_enabled = FALSE,
        quick_switch_pin = NULL
    WHERE id = 'user-uuid';
    ```
