UPDATE poll
SET updated_at = (
    SELECT MAX(created_at)
    FROM poll_response
    WHERE poll_id = poll.id
);
