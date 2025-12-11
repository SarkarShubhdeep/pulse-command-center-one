# Nurse Staffing Schema Setup Guide

This guide walks you through creating the nurse staffing tables in Supabase for shift management and duties tracking.

## Step 1: Create the Nurse Shifts Table

Go to your Supabase dashboard and open the **SQL Editor**. Run the following SQL to create the `public.nurse_shifts` table:

```sql
CREATE TABLE public.nurse_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  shift_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create an index on user_id for faster lookups
CREATE INDEX idx_nurse_shifts_user_id ON public.nurse_shifts(user_id);

-- Create an index on shift_date for filtering by date
CREATE INDEX idx_nurse_shifts_date ON public.nurse_shifts(shift_date);
```

## Step 2: Create the Nurse Duties Table

```sql
CREATE TABLE public.nurse_duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.nurse_shifts(id) ON DELETE CASCADE,
  duty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create an index on shift_id for faster lookups
CREATE INDEX idx_nurse_duties_shift_id ON public.nurse_duties(shift_id);
```

## Step 3: Enable Row Level Security (RLS)

Enable RLS on both tables:

```sql
ALTER TABLE public.nurse_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_duties ENABLE ROW LEVEL SECURITY;
```

## Step 4: Create RLS Policies

Create policies to allow authenticated users to view all shifts and duties:

```sql
-- Allow authenticated users to read all nurse shifts
CREATE POLICY "Users can view all nurse shifts"
  ON public.nurse_shifts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to update their own shifts
CREATE POLICY "Users can update their own shifts"
  ON public.nurse_shifts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all duties
CREATE POLICY "Users can view all duties"
  ON public.nurse_duties
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

## Step 5: Insert Sample Data

First, get the UUIDs of the three nurses from the `public.users` table:

```sql
SELECT id, full_name FROM public.users
WHERE full_name IN ('Mark Hoffner', 'Dimitriv Kravanoff', 'Cindy Maxwell');
```

Then insert the sample shift data (replace the UUIDs with actual values from your users table):

```sql
-- Insert Mark Hoffner's shift
INSERT INTO public.nurse_shifts (user_id, role, shift_start, shift_end, shift_date)
VALUES (
  (SELECT id FROM public.users WHERE full_name = 'Mark Hoffner' LIMIT 1),
  'ICU/Trauma Nurse',
  '07:00:00'::TIME,
  '19:00:00'::TIME,
  CURRENT_DATE
);

-- Insert Dimitriv Kravanoff's shift
INSERT INTO public.nurse_shifts (user_id, role, shift_start, shift_end, shift_date)
VALUES (
  (SELECT id FROM public.users WHERE full_name = 'Dimitriv Kravanoff' LIMIT 1),
  'Emergency Department Nurse',
  '15:00:00'::TIME,
  '23:00:00'::TIME,
  CURRENT_DATE
);

-- Insert Cindy Maxwell's shift
INSERT INTO public.nurse_shifts (user_id, role, shift_start, shift_end, shift_date)
VALUES (
  (SELECT id FROM public.users WHERE full_name = 'Cindy Maxwell' LIMIT 1),
  'Surgical Nurse',
  '07:00:00'::TIME,
  '15:00:00'::TIME,
  CURRENT_DATE
);
```

## Step 6: Insert Sample Duties

```sql
-- Insert duties for Mark Hoffner (UUID: 7bd77f6c-6a63-4578-89c3-ca1efcb92518)
INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Monitor critical patients in ICU' FROM public.nurse_shifts
WHERE user_id = '7bd77f6c-6a63-4578-89c3-ca1efcb92518'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Respond to trauma activations' FROM public.nurse_shifts
WHERE user_id = '7bd77f6c-6a63-4578-89c3-ca1efcb92518'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Administer high-risk medications' FROM public.nurse_shifts
WHERE user_id = '7bd77f6c-6a63-4578-89c3-ca1efcb92518'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Coordinate with trauma team' FROM public.nurse_shifts
WHERE user_id = '7bd77f6c-6a63-4578-89c3-ca1efcb92518'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Document patient vitals q1h' FROM public.nurse_shifts
WHERE user_id = '7bd77f6c-6a63-4578-89c3-ca1efcb92518'
LIMIT 1;

-- Insert duties for Dimitriv Kravanoff (UUID: 38765599-bf71-4fdc-9578-4f307f51a1ff)
INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Triage incoming patients' FROM public.nurse_shifts
WHERE user_id = '38765599-bf71-4fdc-9578-4f307f51a1ff'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Manage acute care situations' FROM public.nurse_shifts
WHERE user_id = '38765599-bf71-4fdc-9578-4f307f51a1ff'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Assist with emergency procedures' FROM public.nurse_shifts
WHERE user_id = '38765599-bf71-4fdc-9578-4f307f51a1ff'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Monitor patient vitals continuously' FROM public.nurse_shifts
WHERE user_id = '38765599-bf71-4fdc-9578-4f307f51a1ff'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Communicate with physicians' FROM public.nurse_shifts
WHERE user_id = '38765599-bf71-4fdc-9578-4f307f51a1ff'
LIMIT 1;

-- Insert duties for Cindy Maxwell (UUID: 66817e71-8d0e-4b2b-99b6-cb088a56c4d2)
INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Prepare operating room' FROM public.nurse_shifts
WHERE user_id = '66817e71-8d0e-4b2b-99b6-cb088a56c4d2'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Assist surgical team' FROM public.nurse_shifts
WHERE user_id = '66817e71-8d0e-4b2b-99b6-cb088a56c4d2'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Manage surgical instruments' FROM public.nurse_shifts
WHERE user_id = '66817e71-8d0e-4b2b-99b6-cb088a56c4d2'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Monitor patient during surgery' FROM public.nurse_shifts
WHERE user_id = '66817e71-8d0e-4b2b-99b6-cb088a56c4d2'
LIMIT 1;

INSERT INTO public.nurse_duties (shift_id, duty)
SELECT id, 'Post-operative patient care' FROM public.nurse_shifts
WHERE user_id = '66817e71-8d0e-4b2b-99b6-cb088a56c4d2'
LIMIT 1;
```

## Step 7: Verify the Setup

Run these queries to verify everything is working:

```sql
-- Check the nurse_shifts table
SELECT ns.id, u.full_name, ns.role, ns.shift_start, ns.shift_end, ns.shift_date
FROM public.nurse_shifts ns
JOIN public.users u ON ns.user_id = u.id
ORDER BY ns.shift_start;

-- Check the nurse_duties table with shift info
SELECT nd.id, u.full_name, nd.duty, ns.shift_start, ns.shift_end
FROM public.nurse_duties nd
JOIN public.nurse_shifts ns ON nd.shift_id = ns.id
JOIN public.users u ON ns.user_id = u.id
ORDER BY u.full_name, nd.id;
```

## Schema Summary

### nurse_shifts Table

-   `id` (UUID): Primary key
-   `user_id` (UUID): Foreign key to users table
-   `role` (TEXT): Nurse role/specialty (e.g., "ICU/Trauma Nurse")
-   `shift_start` (TIME): Start time of shift (e.g., 07:00:00)
-   `shift_end` (TIME): End time of shift (e.g., 19:00:00)
-   `shift_date` (DATE): Date of the shift
-   `created_at` (TIMESTAMP): Record creation timestamp
-   `updated_at` (TIMESTAMP): Record update timestamp

### nurse_duties Table

-   `id` (UUID): Primary key
-   `shift_id` (UUID): Foreign key to nurse_shifts table
-   `duty` (TEXT): Description of the duty
-   `created_at` (TIMESTAMP): Record creation timestamp

## Sample Data Overview

### Mark Hoffner

-   **Role**: ICU/Trauma Nurse
-   **Shift**: 7:00 AM - 7:00 PM
-   **Duties**: Monitor critical patients, respond to trauma, administer medications, coordinate with team, document vitals

### Dimitriv Kravanoff

-   **Role**: Emergency Department Nurse
-   **Shift**: 3:00 PM - 11:00 PM
-   **Duties**: Triage patients, manage acute care, assist with procedures, monitor vitals, communicate with physicians

### Cindy Maxwell

-   **Role**: Surgical Nurse
-   **Shift**: 7:00 AM - 3:00 PM
-   **Duties**: Prepare OR, assist surgical team, manage instruments, monitor patient, post-operative care
