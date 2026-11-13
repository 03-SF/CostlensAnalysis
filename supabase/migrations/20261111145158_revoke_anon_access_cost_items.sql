/*
# Remove anonymous access to cost_items

1. Modified Tables
- `cost_items`: the anonymous (signed-out) role no longer has any table privileges.

2. Security
- Only the `authenticated` role keeps SELECT, INSERT, UPDATE and DELETE, each limited
  to items in projects the user owns (via the existing ownership policies).
- Signed-out visitors cannot reach cost item data.
*/

REVOKE ALL ON cost_items FROM anon;
