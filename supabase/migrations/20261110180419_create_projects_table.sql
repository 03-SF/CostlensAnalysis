/*
# Create projects table (owner-scoped)

1. New Tables
- `projects`: one row per budget project a user creates.
  - `id` (uuid, primary key)
  - `owner_id` (uuid, required, defaults to the signed-in user, references the user account; deleted with the account)
  - `name` (text, required, 1 to 120 characters)
  - `description` (text, optional, up to 1000 characters)
  - `created_at` (timestamp)

2. Security
- Row Level Security is enabled, so no rows are visible unless a policy allows it.
- Only the `authenticated` role is granted access (the app requires sign-in).
- Four policies (select, insert, update, delete) each check that `owner_id` matches the signed-in user.
- Users cannot read, change or delete another user's projects; the database rejects it even if the app code is bypassed.

3. Notes
- Length limits are enforced in the database as well as in the app.
- An index on `owner_id` keeps "my projects" lookups fast.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects (owner_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);
