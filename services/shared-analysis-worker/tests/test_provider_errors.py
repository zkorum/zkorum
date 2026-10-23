from agora_analysis_worker_shared.bedrock_label_summary import (
    BedrockLabelSummaryError,
    BedrockLabelSummaryOutputError,
)
from agora_analysis_worker_shared.description_translation import (
    DescriptionTranslationError,
    DescriptionTranslationOutputError,
)
from agora_analysis_worker_shared.provider_errors import is_provider_output_error


def test_output_failure_is_recognized_through_explicit_cause() -> None:
    wrapped = DescriptionTranslationError("wrapped failure")
    wrapped.__cause__ = DescriptionTranslationOutputError("invalid output")
    assert is_provider_output_error(wrapped)


def test_fallback_outage_does_not_inherit_implicit_output_error() -> None:
    outage = TimeoutError("provider unavailable")
    outage.__context__ = DescriptionTranslationOutputError("invalid output")
    assert not is_provider_output_error(outage)


def test_bedrock_client_failure_is_not_an_output_failure() -> None:
    assert not is_provider_output_error(BedrockLabelSummaryError("invalid client"))
    assert is_provider_output_error(BedrockLabelSummaryOutputError("invalid output"))
