import { z } from "zod";

export const CURRENT_FIVE_ELEMENTS_CONSENT_VERSION = "five-elements-consent-2026-09-11";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const FiveElementsRequestSchema = z
  .object({
    consent: z.literal(true),
    consentVersion: z.string().min(1),
    calendarType: z.enum(["SOLAR", "LUNAR"]),
    birthDate: z.string().regex(YMD_RE, "YYYY-MM-DD 형식이어야 합니다."),
    isLeapMonth: z.boolean().optional(),
    birthTimeUnknown: z.boolean(),
    birthTime: z.string().regex(HM_RE, "HH:mm 형식이어야 합니다.").optional(),
  })
  .refine((data) => data.birthTimeUnknown || Boolean(data.birthTime), {
    message: "birthTimeUnknown이 false이면 birthTime이 필요합니다.",
    path: ["birthTime"],
  })
  .refine(
    (data) => {
      const [y, m, d] = data.birthDate.split("-").map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) return false;
      const parsed = new Date(Date.UTC(y, m - 1, d));
      return (
        parsed.getUTCFullYear() === y &&
        parsed.getUTCMonth() === m - 1 &&
        parsed.getUTCDate() === d
      );
    },
    { message: "존재하지 않는 날짜입니다.", path: ["birthDate"] },
  )
  .refine(
    (data) => {
      const [y] = data.birthDate.split("-").map(Number);
      return y >= 1900 && y <= new Date().getUTCFullYear();
    },
    { message: "생년은 1900년부터 현재 연도 사이여야 합니다.", path: ["birthDate"] },
  )
  .refine(
    (data) => {
      const parsed = new Date(`${data.birthDate}T00:00:00Z`);
      return parsed.getTime() <= Date.now();
    },
    { message: "미래 날짜는 입력할 수 없습니다.", path: ["birthDate"] },
  );

export type FiveElementsRequest = z.infer<typeof FiveElementsRequestSchema>;
