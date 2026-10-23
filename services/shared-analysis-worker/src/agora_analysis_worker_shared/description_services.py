from __future__ import annotations

import logging
from dataclasses import dataclass
from threading import Lock
from typing import TYPE_CHECKING, Literal

from agora_language.detection import (
    DetectionUnavailable,
    detect_with_google,
    is_google_detection_client,
)

from agora_analysis_worker_shared.bedrock_label_summary import (
    BedrockLabelSummaryConfig,
    create_bedrock_converse_client,
    generate_label_summaries_with_bedrock,
)
from agora_analysis_worker_shared.description_generation import generate_english_descriptions
from agora_analysis_worker_shared.description_translation import (
    BedrockTranslationConfig,
    DescriptionTranslationError,
    TranslationFailure,
    TranslationResult,
    create_bedrock_translation_provider,
    description_translation_output_locales,
    description_translation_provider_targets,
    generate_description_translations,
    initialize_google_translation_service,
    merge_translation_results,
    translation_result,
)
from agora_analysis_worker_shared.simulation_providers import (
    generate_simulated_description_translations,
    generate_simulated_label_summaries,
)

if TYPE_CHECKING:
    from collections.abc import Sequence

    from agora_language.detection import DetectionOutcome, LanguageDetectorFunction

    from agora_analysis_worker_shared.bedrock_label_summary import (
        BedrockConverseClient,
        ParsedLabelSummaryOutput,
    )
    from agora_analysis_worker_shared.config import Settings
    from agora_analysis_worker_shared.description_generation import (
        DescriptionGenerationResult,
        DescriptionGenerator,
    )
    from agora_analysis_worker_shared.description_input import ConversationDescriptionInput
    from agora_analysis_worker_shared.description_translation import (
        DescriptionForTranslation,
        DescriptionTranslator,
        GoogleTranslationService,
    )

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class DescriptionTranslatorBundle:
    mode: Literal["simulation", "bedrock", "google", "bedrock_with_google_fallback"]
    translate: DescriptionTranslator


@dataclass(frozen=True)
class TranslationProvider:
    name: Literal["Bedrock", "Google"]
    generate: DescriptionTranslator


def build_description_generator(
    settings: Settings,
    *,
    secondary_detector: LanguageDetectorFunction | None,
) -> DescriptionGenerator | None:
    if settings.ai_description_simulation_enabled:

        def simulate(conversation: ConversationDescriptionInput) -> DescriptionGenerationResult:
            return generate_english_descriptions(
                generate=generate_simulated_label_summaries, conversation=conversation
            )

        return simulate

    if not settings.bedrock_label_summary_configured:
        return None

    config = BedrockLabelSummaryConfig(
        region=settings.aws_ai_label_summary_region,
        model_id=settings.aws_ai_label_summary_model_id,
        temperature=settings.aws_ai_label_summary_temperature,
        top_p=settings.aws_ai_label_summary_top_p,
        max_tokens=settings.aws_ai_label_summary_max_tokens,
        prompt=settings.aws_ai_label_summary_prompt,
        connect_timeout_seconds=settings.aws_client_connect_timeout_seconds,
        read_timeout_seconds=settings.aws_ai_label_summary_read_timeout_seconds,
    )

    client: BedrockConverseClient | None = None
    initialization_lock = Lock()

    def call_provider(request: ConversationDescriptionInput) -> ParsedLabelSummaryOutput:
        nonlocal client
        with initialization_lock:
            if client is None:
                client = create_bedrock_converse_client(
                    region=config.region,
                    connect_timeout_seconds=config.connect_timeout_seconds,
                    read_timeout_seconds=config.read_timeout_seconds,
                )
        return generate_label_summaries_with_bedrock(
            conversation=request, config=config, client=client
        )

    def generate(
        conversation: ConversationDescriptionInput,
    ) -> DescriptionGenerationResult:
        return generate_english_descriptions(
            generate=call_provider,
            conversation=conversation,
            secondary_detector=secondary_detector,
        )

    return generate


def build_description_language_detector(settings: Settings) -> LanguageDetectorFunction | None:
    if (
        settings.ai_description_simulation_enabled
        or not settings.google_translation_credentials_configured
    ):
        return None
    service: GoogleTranslationService | None = None
    initialization_lock = Lock()

    def detect(text: str) -> DetectionOutcome:
        nonlocal service
        # Secondary detection must not make otherwise valid Bedrock generation
        # depend on Google/Secrets Manager availability at worker startup.
        try:
            with initialization_lock:
                if service is None:
                    service = _build_google_translation_service(settings)
        except Exception as error:
            return DetectionUnavailable(error)
        if service is None:
            return DetectionUnavailable(DescriptionTranslationError("Google detection unavailable"))
        client = service.client
        if not is_google_detection_client(client):
            return DetectionUnavailable(
                DescriptionTranslationError(
                    "Google Cloud Translation client does not expose detect_language()"
                )
            )
        return detect_with_google(
            client=client,
            parent=f"projects/{service.config.project_id}/locations/{service.config.location}",
            text=text,
            timeout=service.config.request_timeout_seconds,
        )

    return detect


def build_description_translator(settings: Settings) -> DescriptionTranslatorBundle | None:
    if settings.description_translation_simulation_enabled:

        def simulate(
            *, descriptions: list[DescriptionForTranslation], target_language_codes: list[str]
        ) -> TranslationResult:
            return translation_result(
                description_ids=[description.description_id for description in descriptions],
                target_language_codes=target_language_codes,
                translations=generate_simulated_description_translations(
                    descriptions, target_language_codes
                ),
            )

        return DescriptionTranslatorBundle(
            mode="simulation",
            translate=simulate,
        )

    bedrock_config = (
        BedrockTranslationConfig(
            region=settings.aws_description_translation_region,
            model_id=settings.aws_description_translation_model_id,
            temperature=settings.aws_description_translation_temperature,
            top_p=settings.aws_description_translation_top_p,
            max_tokens=settings.aws_description_translation_max_tokens,
            prompt=settings.aws_description_translation_prompt,
            connect_timeout_seconds=settings.aws_client_connect_timeout_seconds,
            read_timeout_seconds=settings.aws_description_translation_read_timeout_seconds,
        )
        if settings.bedrock_description_translation_configured
        else None
    )
    google_service = _build_google_translation_service(settings)

    if bedrock_config is None and google_service is None:
        return None

    providers: list[TranslationProvider] = []
    if bedrock_config is not None:
        providers.append(
            TranslationProvider(
                name="Bedrock", generate=create_bedrock_translation_provider(bedrock_config)
            )
        )
    if google_service is not None:
        providers.append(
            TranslationProvider(
                name="Google", generate=create_google_translation_provider(google_service)
            )
        )

    def translate(
        *, descriptions: list[DescriptionForTranslation], target_language_codes: list[str]
    ) -> TranslationResult:
        return translate_with_providers(
            providers=providers,
            descriptions=descriptions,
            target_language_codes=target_language_codes,
        )

    if bedrock_config is not None and google_service is not None:
        mode = "bedrock_with_google_fallback"
    elif bedrock_config is not None:
        mode = "bedrock"
    else:
        mode = "google"
    return DescriptionTranslatorBundle(mode=mode, translate=translate)


def _build_google_translation_service(settings: Settings) -> GoogleTranslationService | None:
    try:
        return initialize_google_translation_service(
            google_cloud_service_account_aws_secret_key=(
                settings.google_cloud_service_account_aws_secret_key
            ),
            aws_secret_region=settings.aws_secret_region,
            aws_connect_timeout_seconds=settings.aws_client_connect_timeout_seconds,
            aws_read_timeout_seconds=settings.aws_secret_read_timeout_seconds,
            google_application_credentials_path=settings.google_application_credentials,
            google_cloud_translation_location=settings.google_cloud_translation_location,
            google_cloud_translation_endpoint=settings.google_cloud_translation_endpoint,
            google_cloud_translation_timeout_seconds=(
                settings.google_cloud_translation_timeout_seconds
            ),
        )
    except Exception as error:
        if settings.google_translation_credentials_configured:
            msg = "Google Cloud Translation is configured but could not be initialized"
            raise DescriptionTranslationError(msg) from error
        log.warning(
            "[DescriptionTranslator] Failed to initialize Google Cloud Translation; continuing",
            exc_info=True,
        )
        return None


def create_google_translation_provider(service: GoogleTranslationService) -> DescriptionTranslator:
    def generate(
        *, descriptions: list[DescriptionForTranslation], target_language_codes: list[str]
    ) -> TranslationResult:
        return generate_description_translations(
            service=service,
            descriptions=descriptions,
            target_language_codes=target_language_codes,
        )

    return generate


def translate_with_providers(
    *,
    providers: Sequence[TranslationProvider],
    descriptions: list[DescriptionForTranslation],
    target_language_codes: list[str],
    initial_result: TranslationResult | None = None,
) -> TranslationResult:
    result = translation_result(
        description_ids=[description.description_id for description in descriptions],
        target_language_codes=target_language_codes,
    )
    if initial_result is not None:
        result = merge_translation_results(existing=result, new=initial_result)
    for provider in providers:
        result = retry_translation_provider(
            provider_name=provider.name,
            generate=provider.generate,
            attempts=2,
            descriptions=descriptions,
            target_language_codes=target_language_codes,
            initial_result=result,
        )
    return result


def retry_translation_provider(
    *,
    provider_name: Literal["Bedrock", "Google"],
    attempts: int,
    generate: DescriptionTranslator,
    descriptions: list[DescriptionForTranslation],
    target_language_codes: list[str],
    initial_result: TranslationResult | None = None,
) -> TranslationResult:
    result = translation_result(
        description_ids=[description.description_id for description in descriptions],
        target_language_codes=target_language_codes,
    )
    if initial_result is not None:
        result = merge_translation_results(existing=result, new=initial_result)
    timed_out: set[tuple[int, str]] = set()
    for attempt in range(1, attempts + 1):
        for target in description_translation_provider_targets(target_language_codes):
            locales = description_translation_output_locales(target)
            pending = [
                description
                for description in descriptions
                if any(
                    isinstance(
                        result.outcomes.get((description.description_id, locale)),
                        TranslationFailure,
                    )
                    and (description.description_id, locale) not in timed_out
                    for locale in locales
                )
            ]
            if not pending:
                continue
            generated = generate(descriptions=pending, target_language_codes=[target])
            result = merge_translation_results(existing=result, new=generated)
            for key, outcome in generated.outcomes.items():
                if isinstance(outcome, TranslationFailure):
                    if outcome.reason == "provider_timeout":
                        timed_out.add(key)
                    log.warning(
                        "[DescriptionTranslator] Provider attempt incomplete "
                        "provider=%s attempt=%d/%d description_id=%d locale=%s reason=%s",
                        provider_name,
                        attempt,
                        attempts,
                        key[0],
                        key[1],
                        outcome.reason,
                    )
    return result
