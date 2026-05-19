-- Migration: Disable RLS for all tables to allow public read/write access

ALTER TABLE content_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ba_content_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ba_content_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_ba_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_ba_daily_updates DISABLE ROW LEVEL SECURITY;
