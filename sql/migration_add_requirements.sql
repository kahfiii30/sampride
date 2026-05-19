-- Migration: Add optional/mandatory configuration columns to content_accounts
ALTER TABLE content_accounts ADD COLUMN IF NOT EXISTS req_slide_2 BOOLEAN DEFAULT true;
ALTER TABLE content_accounts ADD COLUMN IF NOT EXISTS req_caption BOOLEAN DEFAULT true;
ALTER TABLE content_accounts ADD COLUMN IF NOT EXISTS req_story BOOLEAN DEFAULT true;
ALTER TABLE content_accounts ADD COLUMN IF NOT EXISTS req_reels BOOLEAN DEFAULT true;
