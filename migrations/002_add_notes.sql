-- Run once against Supabase to add note_folders and notes tables.

CREATE TABLE note_folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(10) DEFAULT '📁',
  color VARCHAR(50) DEFAULT 'default',
  sort_order DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES note_folders(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  sort_order DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger to auto-update updated_at on note edits
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_notes_updated_at();

-- Default "Quick Notes" folder
INSERT INTO note_folders (name, icon, color) VALUES ('Quick Notes', '📝', 'yellow');
