CREATE TABLE IF NOT EXISTS content_ba_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_ba text NOT NULL,
  target_bulanan integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_ba_daily_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ba_id uuid REFERENCES content_ba_targets(id) ON DELETE CASCADE,
  tanggal date NOT NULL,
  realisasi integer NOT NULL DEFAULT 0,
  catatan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE content_ba_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ba_daily_updates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_targets' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON content_ba_targets FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_targets' AND policyname = 'Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON content_ba_targets FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_targets' AND policyname = 'Enable update access for all users'
  ) THEN
    CREATE POLICY "Enable update access for all users" ON content_ba_targets FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_targets' AND policyname = 'Enable delete access for all users'
  ) THEN
    CREATE POLICY "Enable delete access for all users" ON content_ba_targets FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_daily_updates' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON content_ba_daily_updates FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_daily_updates' AND policyname = 'Enable insert access for all users'
  ) THEN
    CREATE POLICY "Enable insert access for all users" ON content_ba_daily_updates FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_daily_updates' AND policyname = 'Enable update access for all users'
  ) THEN
    CREATE POLICY "Enable update access for all users" ON content_ba_daily_updates FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_ba_daily_updates' AND policyname = 'Enable delete access for all users'
  ) THEN
    CREATE POLICY "Enable delete access for all users" ON content_ba_daily_updates FOR DELETE USING (true);
  END IF;
END $$;

-- Insert seed data if table is empty
DO $$
DECLARE
  v_test_id uuid;
  v_kekes_id uuid;
  v_sp_id uuid;
  v_sfyp_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM content_ba_targets LIMIT 1) THEN
    -- Insert BA Targets
    INSERT INTO content_ba_targets (nama_ba, target_bulanan) VALUES 
      ('Test', 30) RETURNING id INTO v_test_id;
    INSERT INTO content_ba_targets (nama_ba, target_bulanan) VALUES 
      ('Kekeshabila', 30) RETURNING id INTO v_kekes_id;
    INSERT INTO content_ba_targets (nama_ba, target_bulanan) VALUES 
      ('Samarinda Pride', 30) RETURNING id INTO v_sp_id;
    INSERT INTO content_ba_targets (nama_ba, target_bulanan) VALUES 
      ('Samarinda FYP', 30) RETURNING id INTO v_sfyp_id;

    -- Insert Daily Updates
    INSERT INTO content_ba_daily_updates (ba_id, tanggal, realisasi) VALUES 
      (v_test_id, CURRENT_DATE, 0),
      (v_kekes_id, CURRENT_DATE, 17),
      (v_sp_id, CURRENT_DATE, 29),
      (v_sfyp_id, CURRENT_DATE, 28);
  END IF;
END $$;
