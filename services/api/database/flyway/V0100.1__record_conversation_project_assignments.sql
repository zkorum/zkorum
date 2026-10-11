INSERT INTO conversation_project_assignment (project_id, conversation_id, first_assigned_at)
SELECT project_id, id, created_at FROM conversation
ON CONFLICT DO NOTHING;

CREATE FUNCTION record_conversation_project_assignment() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO conversation_project_assignment (project_id, conversation_id)
    VALUES (NEW.project_id, NEW.id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER conversation_record_project_assignment
AFTER INSERT OR UPDATE OF project_id ON conversation
FOR EACH ROW EXECUTE FUNCTION record_conversation_project_assignment();

CREATE FUNCTION enforce_conversation_project_assignment() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RAISE EXCEPTION 'Conversation project assignments are immutable';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM conversation
        WHERE id = NEW.conversation_id AND project_id = NEW.project_id
    ) THEN
        RAISE EXCEPTION 'Assignment must match the conversation current project';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER conversation_project_assignment_integrity
BEFORE INSERT OR UPDATE OR DELETE ON conversation_project_assignment
FOR EACH ROW EXECUTE FUNCTION enforce_conversation_project_assignment();

CREATE FUNCTION enforce_email_update_conversation_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE current_project_id integer;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF (NEW.project_id, NEW.conversation_id) IS DISTINCT FROM
           (OLD.project_id, OLD.conversation_id) THEN
            RAISE EXCEPTION 'Email Update conversation scope is immutable';
        END IF;
        RETURN NEW;
    END IF;
    -- Serialize snapshot creation with project moves, including non-API writers.
    SELECT project_id INTO current_project_id FROM conversation
    WHERE id = NEW.conversation_id FOR SHARE;
    IF current_project_id IS DISTINCT FROM NEW.project_id THEN
        RAISE EXCEPTION 'Email Update must use the conversation current project';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER email_update_conversation_scope_integrity
BEFORE INSERT OR UPDATE OF project_id, conversation_id ON conversation_email_update_conversation
FOR EACH ROW EXECUTE FUNCTION enforce_email_update_conversation_scope();
