-- Grant SUPERADMIN (and thus all MASTER_* catalog permissions) to a user
-- after they have signed in at least once (so the users row exists).
--
-- Replace the email below, then run against MySQL:
--   mysql -u ... -p ticketor < database/scripts/grant-superadmin.sql

SET @admin_email := 'admin@example.com';

INSERT INTO user_system_role_mapping (user_id, role_id, granted_by, granted_at)
SELECT u.id, r.id, NULL, CURRENT_TIMESTAMP(3)
FROM users u
CROSS JOIN master_roles r
WHERE u.email_normalized = LOWER(TRIM(@admin_email))
  AND u.deleted_at IS NULL
  AND r.code = 'SUPERADMIN'
  AND r.deleted_at IS NULL
ON DUPLICATE KEY UPDATE granted_at = granted_at;
