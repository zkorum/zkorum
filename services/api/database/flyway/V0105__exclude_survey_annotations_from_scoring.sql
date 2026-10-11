-- Choice annotations are not scoring inputs. Keep timestamp-only saves and
-- annotation-only edits from invalidating otherwise current ranking scores.
CREATE OR REPLACE FUNCTION mark_ranking_scoring_input_dirty_direct()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    new_conversation_id integer;
    old_conversation_id integer;
BEGIN
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'survey_response' THEN
        IF (OLD.participant_id, OLD.conversation_id, OLD.completed_at, OLD.withdrawn_at)
            IS NOT DISTINCT FROM
           (NEW.participant_id, NEW.conversation_id, NEW.completed_at, NEW.withdrawn_at) THEN
            RETURN NEW;
        END IF;
    END IF;
    new_conversation_id := (to_jsonb(NEW)->>TG_ARGV[0])::integer;
    old_conversation_id := (to_jsonb(OLD)->>TG_ARGV[0])::integer;
    IF new_conversation_id IS NOT NULL THEN
        PERFORM mark_ranking_scoring_input_dirty(new_conversation_id);
    END IF;
    IF old_conversation_id IS NOT NULL
       AND old_conversation_id IS DISTINCT FROM new_conversation_id THEN
        PERFORM mark_ranking_scoring_input_dirty(old_conversation_id);
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION mark_ranking_scoring_input_dirty_from_answer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND
       (OLD.survey_response_id, OLD.conversation_id, OLD.survey_question_id,
        OLD.answered_question_semantic_version, OLD.text_value_html,
        OLD.text_value_plain_text, OLD.deleted_at)
        IS NOT DISTINCT FROM
       (NEW.survey_response_id, NEW.conversation_id, NEW.survey_question_id,
        NEW.answered_question_semantic_version, NEW.text_value_html,
        NEW.text_value_plain_text, NEW.deleted_at) THEN
        RETURN NEW;
    END IF;
    PERFORM mark_ranking_scoring_input_dirty(response.conversation_id)
    FROM survey_response response
    WHERE response.id IN (NEW.survey_response_id, OLD.survey_response_id);
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION mark_ranking_scoring_input_dirty_from_answer_option()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND
       (OLD.survey_answer_id, OLD.survey_question_id, OLD.survey_question_option_id, OLD.deleted_at)
        IS NOT DISTINCT FROM
       (NEW.survey_answer_id, NEW.survey_question_id, NEW.survey_question_option_id, NEW.deleted_at) THEN
        RETURN NEW;
    END IF;
    PERFORM mark_ranking_scoring_input_dirty(response.conversation_id)
    FROM survey_answer answer
    JOIN survey_response response ON response.id = answer.survey_response_id
    WHERE answer.id IN (NEW.survey_answer_id, OLD.survey_answer_id);
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;
