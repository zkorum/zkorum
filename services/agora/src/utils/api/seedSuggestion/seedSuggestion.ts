import { isAxiosError } from "axios";
import { DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import {
  Dto,
  type GenerateSeedSuggestionsRequest,
  type GenerateSeedSuggestionsResponse,
  type RecordSeedSuggestionUseRequest,
} from "src/shared/types/dto";

import { api } from "../client";
import { useCommonApi } from "../common";
import { getErrorLogContext } from "../errorLog";

export type GenerateSeedSuggestionsFailure =
  | "not_available"
  | "rate_limited"
  | "failed";

export type GenerateSeedSuggestionsResult =
  | { status: "success"; data: GenerateSeedSuggestionsResponse }
  | { status: "error"; reason: GenerateSeedSuggestionsFailure };

function getFailureReason(error: unknown): GenerateSeedSuggestionsFailure {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "not_available";
    }
    if (error.response?.status === 429) {
      return "rate_limited";
    }
  }
  return "failed";
}

export function useBackendSeedSuggestionApi() {
  const { buildEncodedUcan, createRawAxiosRequestConfig } = useCommonApi();

  async function generateSeedSuggestions({
    request,
    turnstileToken,
    signal,
  }: {
    request: GenerateSeedSuggestionsRequest;
    turnstileToken: string | undefined;
    signal: AbortSignal;
  }): Promise<GenerateSeedSuggestionsResult> {
    try {
      const params = Dto.generateSeedSuggestionsRequest.parse(request);
      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1ConversationSeedGeneratePost(
          params,
          turnstileToken
        );
      const encodedUcan = await buildEncodedUcan(url, options);
      const config = createRawAxiosRequestConfig({
        encodedUcan,
        timeoutProfile: "long-running",
        signal,
      });
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1ConversationSeedGeneratePost(params, turnstileToken, config);
      return {
        status: "success",
        data: Dto.generateSeedSuggestionsResponse.parse(response.data),
      };
    } catch (error) {
      if (!signal.aborted) {
        console.warn(
          "Seed suggestion generation failed",
          getErrorLogContext(error)
        );
      }
      return { status: "error", reason: getFailureReason(error) };
    }
  }

  /**
   * Tells the API that a suggestion was taken as a statement, for usage counts only.
   * Never blocks or interrupts the author: a failure here is ignored.
   */
  async function recordSeedSuggestionUse(
    request: RecordSeedSuggestionUseRequest
  ): Promise<void> {
    try {
      const params = Dto.recordSeedSuggestionUseRequest.parse(request);
      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1ConversationSeedSuggestionUsePost(
          params
        );
      const encodedUcan = await buildEncodedUcan(url, options);
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1ConversationSeedSuggestionUsePost(
        params,
        createRawAxiosRequestConfig({ encodedUcan })
      );
    } catch (error) {
      console.warn(
        "Failed to record acceptance of an AI suggestion",
        getErrorLogContext(error)
      );
    }
  }

  return { generateSeedSuggestions, recordSeedSuggestionUse };
}
