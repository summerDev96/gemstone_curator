import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SAFETY_BLOCKED"
  | "SHARE_EXPIRED"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SAFETY_BLOCKED: 422,
  SHARE_EXPIRED: 410,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      requestId: randomUUID(),
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
  return NextResponse.json(body, { status: STATUS_BY_CODE[code] });
}
