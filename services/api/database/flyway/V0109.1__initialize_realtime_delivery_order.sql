-- Bootstrap existing committed replay history. Late commits remain pending and
-- receive a delivery ID from the dispatcher after this transaction commits.
UPDATE realtime_event_outbox SET delivery_id = id WHERE delivery_id IS NULL;

INSERT INTO realtime_event_dispatch_state (id, last_delivery_id)
SELECT 1, COALESCE(MAX(delivery_id), 0) FROM realtime_event_outbox
ON CONFLICT (id) DO UPDATE
SET last_delivery_id = GREATEST(
    realtime_event_dispatch_state.last_delivery_id,
    EXCLUDED.last_delivery_id
);

-- One wakeup per assignment statement, rather than one notification per row.
-- Delivery IDs and periodic reconciliation remain authoritative.
CREATE FUNCTION notify_realtime_event_delivery() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('realtime_event_outbox', '{"deliveryAssigned":true}');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER realtime_event_outbox_delivery_notify_trigger
AFTER UPDATE OF delivery_id ON realtime_event_outbox
FOR EACH STATEMENT
EXECUTE FUNCTION notify_realtime_event_delivery();
