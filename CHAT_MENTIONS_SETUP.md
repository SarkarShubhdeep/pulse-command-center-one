# Chat Mentions Setup

Run this SQL in your Supabase SQL Editor to update the chat_messages table with mention tracking.

## Step 1: Alter the Table to Add Mentions Column

```sql
-- Add mentioned_user_ids column if it doesn't exist
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[] DEFAULT NULL;
```

## Step 2: Create Index for Mentions

```sql
-- Create index for faster mention queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON public.chat_messages USING GIN (mentioned_user_ids);
```

## Step 3: Update RLS Policies (if needed)

The existing RLS policies should work fine. If you need to add a policy for reading mentions:

```sql
-- This allows users to see messages that mention them
CREATE POLICY "Users can read messages mentioning them"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.uid() = ANY(mentioned_user_ids)
  );
```

## Step 4: Verify Realtime is Enabled

Make sure realtime is still enabled for the chat_messages table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```

---

## Features Implemented

✅ **@Mention Autocomplete**
- Type `@` followed by a name to see suggestions
- Shows max 3 users that match your query
- Arrow keys to navigate, Enter to select
- Mentions are highlighted in blue in messages

✅ **Mention Notifications**
- Red badge with `@` symbol when you're mentioned
- Badge disappears when you open the chat
- Tracked via `mentioned_user_ids` array in database

✅ **Message Count Badge**
- Shows unread message count on chat button
- Displays "9+" for 10+ unread messages
- Disappears when you open the chat
- Replaced by mention badge if you have mentions

✅ **Auto-Read on Open**
- Unread count and mention badges clear when chat is opened
- Tracked via `markAsRead()` function
