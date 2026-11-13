/*
# Create cost_items table (child of projects, owner-scoped through parent)

1. New Tables
- `cost_items`: one row per line item in a budget project.
  - `id` (uuid, primary key)
  - `project_id` (uuid, required, references projects; deleted with the project)
  - `category` (text, required, 1 to 80 characters)
  - `description` (text, optional, up to 500 characters, defaults to empty)
  - `estimated_cost` (numeric, required, >= 0)
  - `actual_cost` (numeric, required, >= 0, defaults to 0)
  - `created_at` (timestamp)

2. Security
- Row Level Security is enabled.
- Only the `authenticated` role is granted access (the app requires sign-in).
- Four policies (select, insert, update, delete) each check ownership through
  the parent projects table: the user must own the project the item belongs to.
- Users cannot read, change or delete another user's cost items; the database
  rejects it even if the app code is bypassed.

3. Notes
- Costs are stored as numeric(14,2) to handle currency values safely.
- An index on project_id keeps "items for this project" lookups fast.
- When a project is deleted, all its cost items are deleted automatically (CASCADE).
*/

CREATE TABLE IF NOT EXISTS cost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  estimated_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  actual_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (actual_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cost_items_project_id_idx ON cost_items (project_id);

ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cost_items TO authenticated;

DROP POLICY IF EXISTS "select_own_cost_items" ON cost_items;
CREATE POLICY "select_own_cost_items" ON cost_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = cost_items.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_cost_items" ON cost_items;
CREATE POLICY "insert_own_cost_items" ON cost_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = cost_items.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_cost_items" ON cost_items;
CREATE POLICY "update_own_cost_items" ON cost_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = cost_items.project_id AND projects.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = cost_items.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_cost_items" ON cost_items;
CREATE POLICY "delete_own_cost_items" ON cost_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = cost_items.project_id AND projects.owner_id = auth.uid())
  );
