# Survey CSV exports

The example files show the related survey exports. Question and option IDs join
the metadata, aggregate, and participant-response files within one export.

## Optional text attached to a choice

- `survey_question_options.csv` includes `allows-text`: `1` means the option
  offers an optional text input; `0` means it does not.
- `survey_participant_responses.csv` is owner-only. Each selected option has its
  own row, identified by `question-id` and `option-id`. Its accompanying text is
  in `answer-text-plain`; `answer-text-html` is empty for choice annotations.
- A selected option with no accompanying text still has a row with an empty
  text cell. Multiple selected options can each have different accompanying text.
- Public and full aggregates count selected options independently of whether
  participants supplied accompanying text.

## Spreadsheet-safe text cells

Before CSV serialization, `answer-text-plain` cells that could be interpreted as
spreadsheet formulas are prefixed with an apostrophe. This includes text starting
with `=`, `+`, `-`, or `@`, including after whitespace. Existing leading
apostrophes are also prefixed, making the encoding reversible. Stored responses
are not changed. CSV quoting still handles commas, quotes, and line breaks.

Programmatic consumers can recover the original text after parsing CSV: if a
cell starts with an apostrophe and the remainder either starts with another
apostrophe or matches `^[\s\uFEFF]*[=+\-@]`, remove exactly the first apostrophe.
Leave other cells unchanged.
