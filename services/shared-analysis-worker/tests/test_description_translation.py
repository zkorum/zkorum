from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

import pytest
from agora_language.detection import DetectedLanguage, UnknownLanguage

if TYPE_CHECKING:
    from collections.abc import Sequence
    from pathlib import Path

import agora_analysis_worker_shared.description_services as description_services
import agora_analysis_worker_shared.description_translation as description_translation
from agora_analysis_worker_shared.config import Settings
from agora_analysis_worker_shared.description_services import (
    TranslationProvider,
    create_google_translation_provider,
    retry_translation_provider,
    translate_with_providers,
)
from agora_analysis_worker_shared.description_translation import (
    BedrockTranslationConfig,
    DescriptionForTranslation,
    DescriptionTranslation,
    DescriptionTranslationOutputError,
    GoogleTranslationConfig,
    GoogleTranslationService,
    TranslationFailure,
    TranslationRepresentativeOpinion,
    TranslationResult,
    build_bedrock_translation_converse_payload,
    create_bedrock_translation_provider,
    generate_description_translations,
    generate_description_translations_with_bedrock,
    parse_bedrock_translation_text,
    parse_description_translation_output,
    parse_service_account_json,
    translation_result,
)


@dataclass(frozen=True)
class FakeTranslationText:
    translated_text: str


@dataclass(frozen=True)
class FakeTranslateTextResponse:
    translations: list[FakeTranslationText]


@dataclass
class FakeTranslationClient:
    requests: list[_Request] = field(default_factory=list)
    output_by_text: dict[str, str] = field(default_factory=dict)

    def translate_text(
        self,
        *,
        parent: str,
        contents: Sequence[str],
        mime_type: str,
        source_language_code: str | None,
        target_language_code: str,
        model: str,
        retry: object | None,
        timeout: float,
    ) -> FakeTranslateTextResponse:
        assert retry is None
        request = _Request(
            parent=parent,
            contents=list(contents),
            mime_type=mime_type,
            source_language_code=source_language_code,
            target_language_code=target_language_code,
            model=model,
            timeout=timeout,
        )
        self.requests.append(request)
        return FakeTranslateTextResponse(
            translations=[
                FakeTranslationText(
                    self.output_by_text.get(content, f"{target_language_code}:{content}")
                )
                for content in contents
            ]
        )


@dataclass
class FakeBedrockTranslationClient:
    responses: list[object]
    calls: list[dict[str, object]] = field(default_factory=list)

    def converse(self, **kwargs: object) -> object:
        self.calls.append(kwargs)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


@dataclass(frozen=True)
class _Request:
    parent: str
    contents: list[str]
    mime_type: str
    source_language_code: str | None
    target_language_code: str
    model: str
    timeout: float


def test_parse_service_account_json_ignores_extra_fields() -> None:
    parsed = parse_service_account_json(
        """
        {
            "project_id": "agora-project",
            "client_email": "service@example.com",
            "private_key": "private-key",
            "ignored": true
        }
        """
    )

    assert parsed.project_id == "agora-project"
    assert parsed.client_email == "service@example.com"
    assert parsed.private_key == "private-key"


def test_generate_description_translations_maps_display_language_codes() -> None:
    client = FakeTranslationClient()
    service = GoogleTranslationService(
        client=client,
        config=GoogleTranslationConfig(
            project_id="project",
            location="us-central1",
            request_timeout_seconds=5.0,
        ),
    )

    translations = generate_description_translations(
        service=service,
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            )
        ],
        target_language_codes=["es", "zh-Hant", "zh-Hans"],
    ).translations

    assert [(translation.locale, translation.label) for translation in translations] == [
        ("es", "es:Transitists"),
        ("zh-Hant", "zh-TW:Transitists"),
        ("zh-Hans", "zh-TW:Transitists"),
    ]
    assert [request.target_language_code for request in client.requests] == [
        "es",
        "es",
        "zh-TW",
        "zh-TW",
    ]
    assert client.requests[0].model.endswith("/models/general/nmt")
    assert client.requests[1].model.endswith("/models/general/translation-llm")
    assert {request.timeout for request in client.requests} == {5.0}


def test_generate_description_translations_skips_source_language() -> None:
    client = FakeTranslationClient()
    service = GoogleTranslationService(
        client=client,
        config=GoogleTranslationConfig(
            project_id="project",
            location="us-central1",
            request_timeout_seconds=5.0,
        ),
    )

    translations = generate_description_translations(
        service=service,
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            )
        ],
        target_language_codes=["en"],
    ).translations

    assert translations == []
    assert client.requests == []


def test_generate_description_translations_batches_google_contents() -> None:
    client = FakeTranslationClient()
    service = GoogleTranslationService(
        client=client,
        config=GoogleTranslationConfig(
            project_id="project",
            location="us-central1",
            request_timeout_seconds=5.0,
        ),
    )

    translations = generate_description_translations(
        service=service,
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            ),
            DescriptionForTranslation(
                description_id=20,
                label="Skeptics",
                summary="Questions cost.",
            ),
        ],
        target_language_codes=["fr"],
    ).translations

    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "fr:Transitists"),
        (20, "fr:Skeptics"),
    ]
    assert [request.contents for request in client.requests] == [
        ["Transitists", "Skeptics"],
        ["Supports transit.", "Questions cost."],
    ]


def test_generate_description_translations_deduplicates_chinese_targets() -> None:
    client = FakeTranslationClient()
    service = GoogleTranslationService(
        client=client,
        config=GoogleTranslationConfig(
            project_id="project",
            location="us-central1",
            request_timeout_seconds=5.0,
        ),
    )

    translations = generate_description_translations(
        service=service,
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            )
        ],
        target_language_codes=["zh-Hans"],
    ).translations

    assert [(translation.locale, translation.label) for translation in translations] == [
        ("zh-Hant", "zh-TW:Transitists"),
        ("zh-Hans", "zh-TW:Transitists"),
    ]
    assert [request.target_language_code for request in client.requests] == [
        "zh-TW",
        "zh-TW",
    ]


def test_generate_bedrock_description_translations_deduplicates_chinese_targets(
    *,
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    caplog.set_level(logging.INFO)
    detections = 0

    def detect(_: str) -> DetectedLanguage:
        nonlocal detections
        detections += 1
        return DetectedLanguage(language_code="zh", confidence=1, provider="lingua")

    monkeypatch.setattr(description_translation, "detect_locally", detect)
    client = FakeBedrockTranslationClient(
        responses=[
            {
                "output": {
                    "message": {
                        "content": [
                            {
                                "text": '{"translations":[{"descriptionId":10,'
                                '"locale":"zh-Hant","reasoning":"ok",'
                                '"label":"繁體標籤","summary":"繁體摘要"}]}'
                            }
                        ]
                    }
                }
            }
        ]
    )

    translations = generate_description_translations_with_bedrock(
        config=BedrockTranslationConfig(
            region="us-east-1",
            model_id="model",
            temperature=0.1,
            top_p=0.9,
            max_tokens=1024,
            prompt="Translate",
            connect_timeout_seconds=2.0,
            read_timeout_seconds=12.0,
        ),
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            )
        ],
        target_language_codes=["zh-Hant", "zh-Hans"],
        client=client,
    ).translations

    assert [(translation.locale, translation.label) for translation in translations] == [
        ("zh-Hant", "繁體標籤"),
        ("zh-Hans", "繁体标签"),
    ]
    assert len(client.calls) == 1
    assert detections == 1
    request_json = json.dumps(client.calls[0], ensure_ascii=False)
    assert '\\"targetLocale\\":\\"zh-Hant\\"' in request_json
    assert "Transitists" not in caplog.text
    assert "Supports transit." not in caplog.text
    assert "繁體標籤" not in caplog.text


def test_parse_description_translation_output_preserves_expected_ids() -> None:
    translations = parse_description_translation_output(
        {
            "translations": [
                {
                    "descriptionId": 10,
                    "locale": "fr",
                    "reasoning": "Skeptics is best translated as Sceptiques here.",
                    "label": "Sceptiques",
                    "summary": "Ce groupe rejette les affirmations trop optimistes.",
                }
            ]
        },
        expected_description_ids={10},
        expected_locale="fr",
    )

    assert [(translation.description_id, translation.locale) for translation in translations] == [
        (10, "fr")
    ]


def test_parse_description_translation_output_accepts_missing_reasoning() -> None:
    translations = parse_description_translation_output(
        {
            "translations": [
                {
                    "descriptionId": 10,
                    "locale": "fr",
                    "label": "Sceptiques",
                    "summary": "Ce groupe rejette les affirmations trop optimistes.",
                }
            ]
        },
        expected_description_ids={10},
        expected_locale="fr",
    )

    assert [translation.description_id for translation in translations] == [10]


def test_parse_description_translation_output_keeps_first_duplicate_id() -> None:
    translations = parse_description_translation_output(
        {
            "translations": [
                {
                    "descriptionId": 10,
                    "locale": "fr",
                    "reasoning": "First translation.",
                    "label": "Sceptiques",
                    "summary": "Ce groupe rejette les affirmations trop optimistes.",
                },
                {
                    "descriptionId": 10,
                    "locale": "fr",
                    "reasoning": "Duplicate translation.",
                    "label": "Critiques",
                    "summary": "Ce groupe rejette les affirmations trop optimistes.",
                },
            ]
        },
        expected_description_ids={10},
        expected_locale="fr",
    )

    assert [translation.label for translation in translations] == ["Sceptiques"]


def test_parse_bedrock_translation_text_skips_preceding_example_json() -> None:
    translations = parse_bedrock_translation_text(
        'Example: {"translations": []}\nFinal: '
        '{"translations":[{"descriptionId":10,"locale":"fr",'
        '"reasoning":"Skeptics is best translated as Sceptiques here.",'
        '"label":"Sceptiques","summary":"Ce groupe rejette les affirmations."}]}',
        expected_description_ids={10},
        expected_locale="fr",
    )

    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "Sceptiques")
    ]


def test_partial_bedrock_translation_fills_missing_items_with_google() -> None:
    client = FakeTranslationClient()
    service = GoogleTranslationService(
        client=client,
        config=GoogleTranslationConfig(
            project_id="project",
            location="us-central1",
            request_timeout_seconds=5.0,
        ),
    )

    translations = translate_with_providers(
        providers=[
            TranslationProvider(name="Google", generate=create_google_translation_provider(service))
        ],
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            ),
            DescriptionForTranslation(
                description_id=20,
                label="Skeptics",
                summary="Questions cost.",
            ),
        ],
        target_language_codes=["fr"],
        initial_result=translation_result(
            description_ids=[10, 20],
            target_language_codes=["fr"],
            translations=[
                DescriptionTranslation(
                    description_id=10,
                    locale="fr",
                    label="Transitistes",
                    summary="Soutient les transports.",
                )
            ],
        ),
    ).translations

    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "Transitistes"),
        (20, "fr:Skeptics"),
    ]
    assert [request.contents for request in client.requests] == [
        ["Skeptics"],
        ["Questions cost."],
    ]


def test_bedrock_timeout_falls_back_to_google_without_retry() -> None:
    bedrock_calls: list[list[int]] = []

    def raise_timeout(
        *,
        descriptions: list[DescriptionForTranslation],
        target_language_codes: list[str],
    ) -> TranslationResult:
        bedrock_calls.append([description.description_id for description in descriptions])
        return translation_result(
            description_ids=[description.description_id for description in descriptions],
            target_language_codes=target_language_codes,
            failure=TranslationFailure(reason="provider_timeout"),
        )

    google_client = FakeTranslationClient()

    google_service = GoogleTranslationService(
        client=google_client,
        config=GoogleTranslationConfig(
            project_id="project",
            location="us-central1",
            request_timeout_seconds=5.0,
        ),
    )
    translations = translate_with_providers(
        providers=[
            TranslationProvider(name="Bedrock", generate=raise_timeout),
            TranslationProvider(
                name="Google", generate=create_google_translation_provider(google_service)
            ),
        ],
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            )
        ],
        target_language_codes=["fr"],
    ).translations

    assert bedrock_calls == [[10]]
    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "fr:Transitists")
    ]


def test_google_fallback_failure_returns_bedrock_partials() -> None:
    def partial_bedrock(
        *,
        descriptions: list[DescriptionForTranslation],
        target_language_codes: list[str],
    ) -> TranslationResult:
        del descriptions, target_language_codes
        return translation_result(
            description_ids=[10, 20],
            target_language_codes=["fr"],
            translations=[
                DescriptionTranslation(
                    description_id=10,
                    locale="fr",
                    label="Transitistes",
                    summary="Soutient les transports.",
                )
            ],
        )

    def raise_google_timeout(
        *,
        descriptions: list[DescriptionForTranslation],
        target_language_codes: list[str],
    ) -> TranslationResult:
        return translation_result(
            description_ids=[description.description_id for description in descriptions],
            target_language_codes=target_language_codes,
            failure=TranslationFailure(reason="provider_timeout"),
        )

    translations = translate_with_providers(
        providers=[
            TranslationProvider(name="Bedrock", generate=partial_bedrock),
            TranslationProvider(name="Google", generate=raise_google_timeout),
        ],
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            ),
            DescriptionForTranslation(
                description_id=20,
                label="Skeptics",
                summary="Questions cost.",
            ),
        ],
        target_language_codes=["fr"],
    ).translations

    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "Transitistes")
    ]


def test_bedrock_partial_retry_stops_after_timeout() -> None:
    bedrock_calls: list[list[int]] = []

    def partial_then_timeout(
        *,
        descriptions: list[DescriptionForTranslation],
        target_language_codes: list[str],
    ) -> TranslationResult:
        bedrock_calls.append([description.description_id for description in descriptions])
        if len(bedrock_calls) == 1:
            return translation_result(
                description_ids=[10, 20],
                target_language_codes=["fr"],
                translations=[
                    DescriptionTranslation(
                        description_id=10,
                        locale="fr",
                        label="Transitistes",
                        summary="Soutient les transports.",
                    )
                ],
            )
        return translation_result(
            description_ids=[description.description_id for description in descriptions],
            target_language_codes=["fr"],
            failure=TranslationFailure(reason="provider_timeout"),
        )

    translations = retry_translation_provider(
        provider_name="Bedrock",
        generate=partial_then_timeout,
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Transitists",
                summary="Supports transit.",
            ),
            DescriptionForTranslation(
                description_id=20,
                label="Skeptics",
                summary="Questions cost.",
            ),
        ],
        target_language_codes=["fr"],
        attempts=3,
    ).translations

    assert bedrock_calls == [[10, 20], [20]]
    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "Transitistes")
    ]


def test_parse_bedrock_translation_text_can_return_partial_valid_items() -> None:
    translations = parse_bedrock_translation_text(
        '{"translations":['
        '{"descriptionId":10,"locale":"fr",'
        '"reasoning":"Skeptics is best translated as Sceptiques here.",'
        '"label":"Sceptiques","summary":"Ce groupe rejette les affirmations."},'
        '{"descriptionId":20,"locale":"fr","reasoning":"Missing fields"}'
        ']}',
        expected_description_ids={10, 20},
        expected_locale="fr",
    )

    assert [(translation.description_id, translation.label) for translation in translations] == [
        (10, "Sceptiques")
    ]


def test_bedrock_translation_payload_uses_title_and_representative_opinions() -> None:
    payload = build_bedrock_translation_converse_payload(
        descriptions=[
            DescriptionForTranslation(
                description_id=10,
                label="Skeptics",
                summary="This cluster rejects uncritical technology claims.",
                conversation_title="How should society govern technology?",
                representative_opinions=[
                    TranslationRepresentativeOpinion(
                        opinion_id=7,
                        stance="disagree",
                        content="Technology always improves society",
                    )
                ],
            )
        ],
        target_language_code="fr",
        config=BedrockTranslationConfig(
            region="us-east-1",
            model_id="model",
            temperature=0.1,
            top_p=0.9,
            max_tokens=1024,
            prompt="Translate",
            connect_timeout_seconds=2.0,
            read_timeout_seconds=12.0,
        ),
    )

    messages = payload.get("messages")
    assert messages is not None
    content = messages[0].get("content")
    assert content is not None
    user_payload = content[0].get("text")
    assert isinstance(user_payload, str)

    assert '"targetLocale":"fr"' in user_payload
    assert '"conversationTitle":"How should society govern technology?"' in user_payload
    assert "conversationBody" not in user_payload
    assert '"stance":"disagree"' in user_payload


@pytest.mark.parametrize(
    ("field", "value", "reason"),
    [
        ("label", " ", "empty_label"),
        ("summary", "\n", "empty_summary"),
        ("label", "x" * 101, "label_too_long"),
        ("summary", "x" * 1001, "summary_too_long"),
        (
            "summary",
            "This group rejects uncritical claims that technology always improves society.",
            "language_mismatch",
        ),
    ],
)
def test_invalid_bedrock_item_does_not_discard_valid_translation(
    *, field: str, value: str, reason: str, caplog: pytest.LogCaptureFixture
) -> None:
    valid = {
        "descriptionId": 10,
        "locale": "fr",
        "label": "Sceptiques",
        "summary": "Ce groupe rejette les affirmations trop optimistes.",
    }
    invalid = {**valid, "descriptionId": 20, field: value}
    translations = parse_description_translation_output(
        {"translations": [valid, invalid]},
        expected_description_ids={10, 20},
        expected_locale="fr",
    )

    assert [translation.description_id for translation in translations] == [10]
    assert f"reason={reason}" in caplog.text
    assert "Ce groupe rejette" not in caplog.text
    if value.strip():
        assert value.strip() not in caplog.text


def test_translation_language_check_allows_uncertainty_and_unsupported_kyrgyz(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def unknown(_: str) -> UnknownLanguage:
        return UnknownLanguage()

    def kazakh(_: str) -> DetectedLanguage:
        return DetectedLanguage(language_code="kk", confidence=1, provider="lingua")

    monkeypatch.setattr(description_translation, "detect_locally", unknown)
    translation = DescriptionTranslation(
        description_id=10, locale="fr", label="Agora", summary="Agora"
    )
    assert description_translation.translation_rejection_reason(translation) is None

    monkeypatch.setattr(
        description_translation,
        "detect_locally",
        kazakh,
    )
    kyrgyz = DescriptionTranslation(
        description_id=10, locale="ky", label="Топ", summary="Бул топ коомдук транспортту колдойт."
    )
    assert description_translation.translation_rejection_reason(kyrgyz) is None


@pytest.mark.parametrize("all_invalid", [False, True])
def test_google_output_is_validated_before_batch_persistence(all_invalid: bool) -> None:
    client = FakeTranslationClient(output_by_text={"Bad summary": "x" * 1001})
    service = GoogleTranslationService(
        client=client,
        config=GoogleTranslationConfig(
            project_id="project", location="us-central1", request_timeout_seconds=5
        ),
    )
    descriptions = [
        DescriptionForTranslation(description_id=20, label="Group", summary="Bad summary")
    ]
    if not all_invalid:
        descriptions.append(
            DescriptionForTranslation(description_id=10, label="Group", summary="Questions cost.")
        )
    result = generate_description_translations(
        service=service, descriptions=descriptions, target_language_codes=["fr"]
    )
    assert result.outcomes[(20, "fr")] == TranslationFailure(reason="invalid_output")
    assert [translation.description_id for translation in result.translations] == (
        [] if all_invalid else [10]
    )


def _bedrock_response(*, description_id: int) -> dict[str, object]:
    text = json.dumps(
        {
            "translations": [
                {
                    "descriptionId": description_id,
                    "locale": "fr",
                    "label": "Sceptiques",
                    "summary": "Ce groupe rejette les affirmations trop optimistes.",
                }
            ]
        }
    )
    return {"output": {"message": {"content": [{"text": text}]}}}


def _bedrock_config() -> BedrockTranslationConfig:
    return BedrockTranslationConfig(
        region="us-east-1",
        model_id="model",
        temperature=0.1,
        top_p=0.9,
        max_tokens=4096,
        prompt="Translate",
        connect_timeout_seconds=2,
        read_timeout_seconds=60,
    )


@pytest.mark.parametrize("second_half_fails", [False, True])
def test_token_limited_bedrock_batch_splits_and_preserves_successes(
    *, second_half_fails: bool, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO)
    client = FakeBedrockTranslationClient(
        responses=[
            {
                "stopReason": "max_tokens",
                "usage": {"inputTokens": 100, "outputTokens": 4096},
                "output": {"message": {"content": [{"text": "truncated private output"}]}},
            },
            _bedrock_response(description_id=10),
            TimeoutError("private provider error")
            if second_half_fails
            else _bedrock_response(description_id=20),
        ]
    )
    translations = generate_description_translations_with_bedrock(
        config=BedrockTranslationConfig(
            region="us-east-1",
            model_id="model",
            temperature=0.1,
            top_p=0.9,
            max_tokens=4096,
            prompt="Translate",
            connect_timeout_seconds=2,
            read_timeout_seconds=60,
        ),
        descriptions=[
            DescriptionForTranslation(
                description_id=description_id, label="Group", summary="Summary"
            )
            for description_id in [10, 20]
        ],
        target_language_codes=["fr"],
        client=client,
    ).translations

    assert [translation.description_id for translation in translations] == (
        [10] if second_half_fails else [10, 20]
    )
    assert len(client.calls) == 3
    assert "stop_reason=max_tokens input_tokens=100 output_tokens=4096" in caplog.text
    assert "Splitting token-limited" in caplog.text
    assert "truncated private output" not in caplog.text
    assert "private provider error" not in caplog.text


def test_bedrock_retry_preserves_successful_locale_when_later_locale_fails() -> None:
    calls: list[str] = []

    def generate(
        *,
        descriptions: list[DescriptionForTranslation],
        target_language_codes: list[str],
    ) -> TranslationResult:
        del descriptions
        locale = target_language_codes[0]
        calls.append(locale)
        if locale == "es":
            return translation_result(description_ids=[10], target_language_codes=[locale])
        return translation_result(
            description_ids=[10],
            target_language_codes=[locale],
            translations=[
                DescriptionTranslation(
                    description_id=10, locale=locale, label="Sceptiques", summary="Résumé"
                )
            ],
        )

    translations = retry_translation_provider(
        provider_name="Bedrock",
        generate=generate,
        descriptions=[
            DescriptionForTranslation(description_id=10, label="Group", summary="Summary")
        ],
        target_language_codes=["fr", "es"],
        attempts=2,
    ).translations

    assert calls == ["fr", "es", "es"]
    assert [translation.locale for translation in translations] == ["fr"]


def test_invalid_json_diagnostics_do_not_log_provider_text(
    caplog: pytest.LogCaptureFixture,
) -> None:
    with pytest.raises(DescriptionTranslationOutputError):
        parse_bedrock_translation_text(
            "private malformed provider output",
            expected_description_ids={10},
            expected_locale="fr",
        )
    assert "json_candidate_count=0 expected_description_count=1" in caplog.text
    assert "private malformed provider output" not in caplog.text


def test_token_limited_batch_does_not_repeat_already_valid_items() -> None:
    partial_response = _bedrock_response(description_id=10)
    partial_response["stopReason"] = "max_tokens"
    client = FakeBedrockTranslationClient(
        responses=[partial_response, _bedrock_response(description_id=20)]
    )
    translations = generate_description_translations_with_bedrock(
        config=BedrockTranslationConfig(
            region="us-east-1",
            model_id="model",
            temperature=0.1,
            top_p=0.9,
            max_tokens=4096,
            prompt="Translate",
            connect_timeout_seconds=2,
            read_timeout_seconds=60,
        ),
        descriptions=[
            DescriptionForTranslation(
                description_id=description_id, label="Group", summary="Summary"
            )
            for description_id in [10, 20]
        ],
        target_language_codes=["fr"],
        client=client,
    ).translations
    assert [translation.description_id for translation in translations] == [10, 20]
    assert len(client.calls) == 2


def test_split_timeout_stops_the_entire_provider_burst_without_leaking_errors(
    caplog: pytest.LogCaptureFixture,
) -> None:
    client = FakeBedrockTranslationClient(
        responses=[
            {
                "stopReason": "max_tokens",
                "output": {"message": {"content": [{"text": "private truncated output"}]}},
            },
            TimeoutError("private provider response and credentials"),
        ]
    )

    def generate(
        *, descriptions: list[DescriptionForTranslation], target_language_codes: list[str]
    ) -> TranslationResult:
        return generate_description_translations_with_bedrock(
            config=_bedrock_config(),
            descriptions=descriptions,
            target_language_codes=target_language_codes,
            client=client,
        )

    result = retry_translation_provider(
        provider_name="Bedrock",
        generate=generate,
        attempts=2,
        descriptions=[
            DescriptionForTranslation(description_id=value, label="Group", summary="Summary")
            for value in [10, 20, 30, 40]
        ],
        target_language_codes=["fr"],
    )
    assert len(client.calls) == 2
    assert list(result.outcomes.values()) == [TranslationFailure(reason="provider_timeout")] * 4
    assert "private" not in caplog.text


def test_chinese_fallback_preserves_existing_script_without_duplicate_outputs() -> None:
    traditional = DescriptionTranslation(
        description_id=10, locale="zh-Hant", label="審慎派", summary="這個群體支持審慎監管。"
    )
    simplified = DescriptionTranslation(
        description_id=10, locale="zh-Hans", label="审慎派", summary="这个群体支持审慎监管。"
    )

    def generate(
        *, descriptions: list[DescriptionForTranslation], target_language_codes: list[str]
    ) -> TranslationResult:
        return translation_result(
            description_ids=[description.description_id for description in descriptions],
            target_language_codes=target_language_codes,
            translations=[
                DescriptionTranslation(
                    description_id=10, locale="zh-Hant", label="改寫", summary="改寫內容。"
                ),
                simplified,
            ],
        )

    result = translate_with_providers(
        providers=[TranslationProvider(name="Google", generate=generate)],
        descriptions=[
            DescriptionForTranslation(description_id=10, label="Group", summary="Summary")
        ],
        target_language_codes=["zh-Hans"],
        initial_result=translation_result(
            description_ids=[10], target_language_codes=["zh-Hant"], translations=[traditional]
        ),
    )
    assert result.translations == [traditional, simplified]


def test_bedrock_translation_client_is_lazy_retryable_and_reused(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeBedrockTranslationClient(
        responses=[_bedrock_response(description_id=10), _bedrock_response(description_id=10)]
    )
    creations = 0

    def create_client(
        *, region: str, connect_timeout_seconds: float, read_timeout_seconds: float
    ) -> FakeBedrockTranslationClient:
        del region, connect_timeout_seconds, read_timeout_seconds
        nonlocal creations
        creations += 1
        if creations == 1:
            raise TimeoutError("private initialization failure")
        return client

    monkeypatch.setattr(description_translation, "create_bedrock_converse_client", create_client)
    generate = create_bedrock_translation_provider(_bedrock_config())
    descriptions = [DescriptionForTranslation(description_id=10, label="Group", summary="Summary")]
    assert creations == 0
    failed = generate(descriptions=descriptions, target_language_codes=["fr"])
    assert failed.outcomes[(10, "fr")] == TranslationFailure(reason="provider_timeout")
    for _ in range(2):
        result = generate(descriptions=descriptions, target_language_codes=["fr"])
        assert len(result.translations) == 1
    assert creations == 2


def test_built_translator_falls_back_without_exposing_provider_errors(
    *,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.chdir(tmp_path)
    bedrock = FakeBedrockTranslationClient(responses=[TimeoutError("private provider payload")])
    google = FakeTranslationClient()

    def create_client(**_kwargs: object) -> FakeBedrockTranslationClient:
        return bedrock

    def build_google(_: Settings) -> GoogleTranslationService:
        return GoogleTranslationService(
            client=google,
            config=GoogleTranslationConfig(
                project_id="project", location="us-central1", request_timeout_seconds=5
            ),
        )

    monkeypatch.setattr(description_translation, "create_bedrock_converse_client", create_client)
    monkeypatch.setattr(description_services, "_build_google_translation_service", build_google)
    bundle = description_services.build_description_translator(Settings(connection_string="test"))
    assert bundle is not None
    result = bundle.translate(
        descriptions=[
            DescriptionForTranslation(
                description_id=10, label="Skeptics", summary="Questions cost."
            )
        ],
        target_language_codes=["fr"],
    )
    assert bundle.mode == "bedrock_with_google_fallback"
    assert [translation.label for translation in result.translations] == ["fr:Skeptics"]
    assert len(bedrock.calls) == 1
    assert len(google.requests) == 2
    assert "private provider payload" not in caplog.text
