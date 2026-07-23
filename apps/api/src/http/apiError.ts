import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export type ApiErrorCode =
  | "authentication_required"
  | "conflict"
  | "domain_rule_failed"
  | "forbidden"
  | "internal_error"
  | "invalid_request"
  | "not_found"
  | "upstream_error";

export type ApiErrorResponse = {
  code: ApiErrorCode;
  error: string;
};

export function sendApiError(response: Response, status: number, code: ApiErrorCode, error: string) {
  response.status(status).json({ code, error } satisfies ApiErrorResponse);
}

export function apiErrorEnvelope(_request: Request, response: Response, next: NextFunction) {
  const sendJson = response.json.bind(response);

  response.json = ((body: unknown) => {
    if (isLegacyErrorBody(body)) {
      return sendJson({
        code: getErrorCode(response.statusCode),
        error: body.error
      } satisfies ApiErrorResponse);
    }

    return sendJson(body);
  }) as Response["json"];

  next();
}

export const unexpectedErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error("Unhandled API error", error);

  if (response.headersSent) return;

  sendApiError(response, 500, "internal_error", "The request could not be completed");
};

function isLegacyErrorBody(body: unknown): body is { error: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string" &&
    !("code" in body)
  );
}

function getErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "authentication_required";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "domain_rule_failed";
  if (status === 502) return "upstream_error";
  if (status >= 500) return "internal_error";
  return "invalid_request";
}
