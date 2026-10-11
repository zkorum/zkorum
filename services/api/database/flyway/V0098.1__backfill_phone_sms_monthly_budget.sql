-- V0097 introduced a zero monthly default for pre-existing policies. Give
-- previously enabled policies the default allowance without reopening shutdowns
-- or changing their operator-configured estimates, burst caps, or pauses.
UPDATE phone_sms_budget_policy
SET monthly_budget_cents = 3000,
    updated_at = clock_timestamp()
WHERE monthly_budget_cents = 0
  AND sending_enabled = true;
