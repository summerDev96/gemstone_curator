import { z } from "zod";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 나와 상대방 양쪽에 공통으로 쓰는 생년월일시 스키마. */
export const BirthInfoSchema = z
  .object({
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
    (data) => new Date(`${data.birthDate}T00:00:00Z`).getTime() <= Date.now(),
    { message: "미래 날짜는 입력할 수 없습니다.", path: ["birthDate"] },
  );

export const RelationshipRequestSchema = z.object({
  relationshipType: z.enum(["FAMILY", "FRIEND", "ROMANTIC", "COLLEAGUE", "OTHER"]),
  relationshipGoalTagId: z.string().uuid(),
  partnerNickname: z.string().min(1).max(20),
  /** 이미 오행 분석(S08)을 마친 추천이면 생략 가능(기존 결과를 재사용). 없으면 필수. */
  myBirthInfo: BirthInfoSchema.optional(),
  partnerBirthInfo: BirthInfoSchema,
});

export type RelationshipRequest = z.infer<typeof RelationshipRequestSchema>;
