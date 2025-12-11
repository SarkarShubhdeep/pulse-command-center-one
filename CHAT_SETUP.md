# Chat Messages Table Setup

Run this SQL in your Supabase SQL Editor to create the chat_messages table.

## Step 1: Create the Table

```sql
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
```

## Step 2: Enable Row Level Security

```sql
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read messages
CREATE POLICY "Authenticated users can read messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Step 3: Enable Realtime

Go to Supabase Dashboard → Database → Replication and enable realtime for the `chat_messages` table.

Or run this SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```
