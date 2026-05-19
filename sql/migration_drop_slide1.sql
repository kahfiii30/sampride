-- Migration: Drop slide_1 column from daily_checklists
ALTER TABLE daily_checklists DROP COLUMN IF EXISTS slide_1;
