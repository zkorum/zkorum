-- Apply after deploying the survey-eligibility fix in math-updater. Existing
-- published snapshots were built without filtering required survey responses.
-- Schedule fresh generations through the durable work-state reconciliation
-- path, preserving historical snapshots and any currently running leases.
CREATE TEMP TABLE survey_eligibility_recompute_conversations ON COMMIT DROP AS
SELECT conversation.id AS conversation_id, conversation.polis_config_id
FROM conversation
JOIN survey_config config
    ON config.conversation_id = conversation.id
   AND config.deleted_at IS NULL
   AND config.is_optional = false
WHERE conversation.conversation_type = 'polis'
  AND conversation.current_content_id IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM vote
      JOIN opinion ON opinion.id = vote.opinion_id
      JOIN "user" voter ON voter.id = vote.author_id
      WHERE opinion.conversation_id = conversation.id
        AND opinion.current_content_id IS NOT NULL
        AND vote.current_content_id IS NOT NULL
        AND voter.is_deleted = false
  )
  AND EXISTS (
      SELECT 1
      FROM survey_question question
      WHERE question.survey_config_id = config.id
        AND question.current_content_id IS NOT NULL
        AND question.is_required = true
  );

UPDATE polis_conversation_config config
SET
    analysis_data_generation = config.analysis_data_generation + 1,
    updated_at = now()
FROM survey_eligibility_recompute_conversations target
WHERE config.id = target.polis_config_id;

WITH current_specs AS (
    SELECT DISTINCT ON (spec.key) spec.id
    FROM opinion_group_spec spec
    ORDER BY spec.key, spec.version DESC
)
INSERT INTO analysis_work_state (
    conversation_id,
    opinion_group_spec_id,
    dirty_since,
    created_at,
    updated_at
)
SELECT target.conversation_id, spec.id, now(), now(), now()
FROM survey_eligibility_recompute_conversations target
CROSS JOIN current_specs spec
ON CONFLICT (conversation_id, opinion_group_spec_id) DO UPDATE
SET
    dirty_since = COALESCE(analysis_work_state.dirty_since, EXCLUDED.dirty_since),
    updated_at = EXCLUDED.updated_at;
