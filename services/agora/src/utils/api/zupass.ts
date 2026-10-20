import { DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import {
  type ConversationOnboardingTicketVerifyRequest,
  type ConversationOnboardingTicketVerifyResponse,
  Dto,
  type VerifyEventTicket200,
} from "src/shared/types/dto";
import type { EventSlug } from "src/shared/types/zod";
import type { ParticipationRequestResult } from "src/utils/api/participation/requestResult";

import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { api } from "./client";
import { useCommonApi } from "./common";

export interface VerifyTicketParams {
  proof: unknown;
  eventSlug: EventSlug;
}

export function useBackendZupassApi() {
  const { buildEncodedUcan } = useCommonApi();

  /**
   * Verify a Zupass event ticket GPC proof with the backend
   * Creates a DID if one doesn't exist (allows unauthenticated users)
   */
  async function verifyEventTicket({
    proof,
    eventSlug,
  }: VerifyTicketParams): Promise<VerifyEventTicket200> {
    const params = {
      proof,
      eventSlug,
    };

    const { url, options } =
      await DefaultApiAxiosParamCreator().apiV1AuthTicketVerifyPost(params);
    const encodedUcan = await buildEncodedUcan(url, options);
    const response = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1AuthTicketVerifyPost(params, {
      headers: {
        ...buildAuthorizationHeader(encodedUcan),
      },
    });

    return Dto.verifyEventTicket200.parse(response.data);
  }

  async function verifyConversationEventTicket({
    request,
    isCurrent,
  }: {
    request: ConversationOnboardingTicketVerifyRequest;
    isCurrent: () => boolean;
  }): Promise<
    ParticipationRequestResult<ConversationOnboardingTicketVerifyResponse>
  > {
    try {
      const params =
        Dto.conversationOnboardingTicketVerifyRequest.parse(request);
      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1ConversationOnboardingTicketVerifyPost(
          params
        );
      const encodedUcan = await buildEncodedUcan(url, options);
      if (!isCurrent()) return { status: "cancelled" };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1ConversationOnboardingTicketVerifyPost(params, {
        headers: buildAuthorizationHeader(encodedUcan),
      });
      if (!isCurrent()) return { status: "cancelled" };
      return {
        status: "completed",
        data: Dto.conversationOnboardingTicketVerifyResponse.parse(
          response.data
        ),
      };
    } catch (error) {
      if (!isCurrent()) return { status: "cancelled" };
      throw error;
    }
  }

  return { verifyEventTicket, verifyConversationEventTicket };
}
