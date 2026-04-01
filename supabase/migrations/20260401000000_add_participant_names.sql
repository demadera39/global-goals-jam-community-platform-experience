-- Add first_name and last_name columns for manually added participants
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS last_name text;

-- Update RLS policies to include new columns (already covered by existing policies)
