import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'example-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Account = {
  id: string;
  name: string;
  is_active: boolean;
  req_slide_2: boolean;
  req_caption: boolean;
  req_story: boolean;
  req_reels: boolean;
  created_at?: string;
};

export type DailyChecklist = {
  id: string;
  account_id: string;
  checklist_date: string;
  slide_2: boolean;
  caption: boolean;
  story: boolean;
  reels: boolean;
  notes: string;
};

export type MonthlyTarget = {
  id: string;
  account_id: string;
  month: number;
  year: number;
  target_content: number;
  completed_content: number;
};

export type BATarget = {
  id: string;
  account_id: string;
  month: number;
  year: number;
  target_content: number;
};

export type BAProgress = {
  id: string;
  account_id: string;
  progress_date: string;
  month: number;
  year: number;
  completed_content: number;
  notes?: string;
};

export type ContentBATarget = {
  id: string;
  nama_ba: string;
  target_bulanan: number;
  created_at?: string;
  updated_at?: string;
};

export type ContentBADailyUpdate = {
  id: string;
  ba_id: string;
  tanggal: string;
  realisasi: number;
  catatan?: string;
  created_at?: string;
  updated_at?: string;
};
