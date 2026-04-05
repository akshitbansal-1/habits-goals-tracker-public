-- Migration: Add goals and habit_goal_links tables
-- Safe to run against existing database — purely additive, no changes to items or daily_logs

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  identity_statement VARCHAR(500),   -- "I am becoming someone who..."
  why_it_matters TEXT,               -- psychological anchoring for motivation
  target_completions INTEGER NOT NULL,
  deadline DATE,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_goal_links (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE(goal_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- Compound index for fast goal progress counting
CREATE INDEX IF NOT EXISTS idx_daily_logs_item_date
  ON daily_logs(item_id, log_date)
  WHERE completed = true;
