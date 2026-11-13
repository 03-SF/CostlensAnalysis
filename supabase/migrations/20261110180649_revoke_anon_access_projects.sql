/*
# Remove anonymous access to projects

1. Modified Tables
- `projects`: the anonymous (signed-out) role no longer has any table privileges.

2. Security
- Only the `authenticated` role keeps SELECT, INSERT, UPDATE and DELETE, and each of those is still limited to the user's own rows by the policies.
- Signed-out visitors cannot reach project data even if a policy is later mis-written.

3. Notes
- Removing these grants does not change any data.
*/

REVOKE ALL ON projects FROM anon;
