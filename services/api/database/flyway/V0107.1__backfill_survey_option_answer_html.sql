-- Legacy annotations are plain text: escape them before introducing HTML rendering.
-- Include soft-deleted rows so the paired-content invariant also holds for tombstones.
UPDATE survey_answer_option
SET text_value_html = '<p>' || replace(replace(
    replace(
        replace(
            replace(
                replace(text_value_plain_text, '&', '&amp;'),
                '<', '&lt;'
            ),
            '>', '&gt;'
        ),
        E'\r\n', E'\n'
    ),
    E'\r', E'\n'
), E'\n', '<br>') || '</p>'
WHERE text_value_plain_text IS NOT NULL
  AND text_value_html IS NULL;
