-- ============================================
-- Aurum Memory Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Main memory table for cloud sync
CREATE TABLE IF NOT EXISTS aurum_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  conversations JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  total_interactions INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE aurum_memory ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own memory"
  ON aurum_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory"
  ON aurum_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory"
  ON aurum_memory FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_aurum_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aurum_memory_updated
  BEFORE UPDATE ON aurum_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_aurum_memory_timestamp();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_aurum_memory_updated
  ON aurum_memory(updated_at DESC);
