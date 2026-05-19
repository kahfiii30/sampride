DROP TABLE IF EXISTS ba_content_progress CASCADE;
DROP TABLE IF EXISTS ba_content_targets CASCADE;
DROP TABLE IF EXISTS monthly_targets CASCADE;
DROP TABLE IF EXISTS daily_checklists CASCADE;
DROP TABLE IF EXISTS content_accounts CASCADE;

CREATE TABLE content_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  req_slide_2 BOOLEAN DEFAULT true,
  req_caption BOOLEAN DEFAULT true,
  req_story BOOLEAN DEFAULT true,
  req_reels BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE daily_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES content_accounts(id) ON DELETE CASCADE,
  checklist_date DATE NOT NULL,
  slide_2 BOOLEAN DEFAULT false,
  caption BOOLEAN DEFAULT false,
  story BOOLEAN DEFAULT false,
  reels BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(account_id, checklist_date)
);

CREATE TABLE monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES content_accounts(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  target_content INT DEFAULT 0,
  completed_content INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(account_id, month, year)
);

CREATE TABLE ba_content_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES content_accounts(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  target_content INT DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(account_id, month, year)
);

CREATE TABLE ba_content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES content_accounts(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  completed_content INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(account_id, progress_date)
);

ALTER TABLE content_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ba_content_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ba_content_progress DISABLE ROW LEVEL SECURITY;
