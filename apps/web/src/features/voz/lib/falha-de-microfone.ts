export type MicrophoneReactionFailure = "ignorar" | "adiar" | "mutar" | "estourar";

export interface FailureMicrophoneContext {
  reconnecting: boolean;
}

const PERSON_REQUEST_ACTION = new Set([
  "NotAllowedError",
  "NotFoundError",
  "NotReadableError",
  "OverconstrainedError",
  "SecurityError",
  "PermissionDeniedError",
  "DevicesError",
  "DeviceUnsupportedError",
]);

const TRANSIENT = new Set([
  "AbortError",
  "InvalidStateError",
  "UnexpectedConnectionState",
  "ConnectionError",
  "PublishTrackError",
]);

const SCHEDULING_ERROR = new Set(["TypeError", "TrackInvalidError"]);

const WITHOUT_CONNECTION = /not connected|disconnected|no connection|closed/i;

const errorName = (error: unknown): string => {
  if (error instanceof Error) return error.name;
  if (typeof error === "object" && error !== null && "name" in error) {
    const name = (error as { name: unknown }).name;
    return typeof name === "string" ? name : "";
  }
  return "";
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
};

export function microphoneReactionFailure(
  error: unknown,
  context: FailureMicrophoneContext = { reconnecting: false },
): MicrophoneReactionFailure {
  if (error === null || error === undefined) return "ignorar";

  const name = errorName(error);

  if (SCHEDULING_ERROR.has(name)) return "estourar";

  if (PERSON_REQUEST_ACTION.has(name)) return "mutar";

  if (TRANSIENT.has(name)) return "adiar";

  if (WITHOUT_CONNECTION.test(errorMessage(error))) return "adiar";

  return context.reconnecting ? "adiar" : "mutar";
}
