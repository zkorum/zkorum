export type ParticipationRequestResult<Response> =
  | { status: "completed"; data: Response }
  | { status: "cancelled" };
