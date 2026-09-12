import { Lunar, Solar } from "lunar-javascript";

export type FiveElement = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";
export type CalendarType = "SOLAR" | "LUNAR";

const CHAR_TO_ELEMENT: Record<string, FiveElement> = {
  木: "WOOD",
  火: "FIRE",
  土: "EARTH",
  金: "METAL",
  水: "WATER",
};

const ELEMENT_ORDER: FiveElement[] = ["WOOD", "FIRE", "EARTH", "METAL", "WATER"];

/** 오행 상생 관계: key가 생성하는(돕는) 대상 원소. docs/08 "오행 보완" 참조(전문가 검수 전 단순화). */
export const GENERATES: Record<FiveElement, FiveElement> = {
  WOOD: "FIRE",
  FIRE: "EARTH",
  EARTH: "METAL",
  METAL: "WATER",
  WATER: "WOOD",
};

export interface FiveElementInput {
  calendarType: CalendarType;
  year: number;
  month: number;
  day: number;
  isLeapMonth?: boolean;
  birthTimeUnknown: boolean;
  hour?: number;
  minute?: number;
}

export interface FiveElementResult {
  /** 목화토금수 각 원소가 사주팔자(6~8자) 중 차지하는 비율 (합계 1.0) */
  balance: Record<FiveElement, number>;
  /** 가장 적게 등장한(보완이 필요한) 원소. 동률 시 목화토금수 순서로 결정론적 선택. */
  neededElement: FiveElement;
  /** 시주 포함 여부(출생시간 미상 시 6자만 사용) */
  usedTimePillar: boolean;
}

function toSolar(input: FiveElementInput): Solar {
  if (input.calendarType === "SOLAR") {
    if (input.birthTimeUnknown) {
      return Solar.fromYmd(input.year, input.month, input.day);
    }
    return Solar.fromYmdHms(
      input.year,
      input.month,
      input.day,
      input.hour ?? 0,
      input.minute ?? 0,
      0,
    );
  }

  const lunarMonth = input.isLeapMonth ? -input.month : input.month;
  const lunar = Lunar.fromYmd(input.year, lunarMonth, input.day);
  return lunar.getSolar();
}

function elementsOf(wuXing: string): FiveElement[] {
  return Array.from(wuXing)
    .map((ch) => CHAR_TO_ELEMENT[ch])
    .filter((el): el is FiveElement => Boolean(el));
}

/**
 * docs/08-recommendation-engine.md, docs/09의 오행 컨텍스트와 연결되는 계산 로직.
 * 명리학 전문가 검수 전 단순화된 초안이다(docs/13 "오행 계산 방식" 참조):
 * - 용신(用神) 판단 없이, 사주팔자 8자(또는 시주 제외 6자) 중 최소 빈도 원소를 "필요한 기운"으로 본다.
 * - 절기 기준 월주 계산은 lunar-javascript 라이브러리에 위임한다.
 */
export function calculateFiveElements(input: FiveElementInput): FiveElementResult {
  const solar = toSolar(input);
  const bazi = solar.getLunar().getEightChar();

  const usedTimePillar = !input.birthTimeUnknown;
  const wuXingStrings = [
    bazi.getYearWuXing(),
    bazi.getMonthWuXing(),
    bazi.getDayWuXing(),
    ...(usedTimePillar ? [bazi.getTimeWuXing()] : []),
  ];

  const elements = wuXingStrings.flatMap(elementsOf);

  const counts: Record<FiveElement, number> = {
    WOOD: 0,
    FIRE: 0,
    EARTH: 0,
    METAL: 0,
    WATER: 0,
  };
  for (const el of elements) counts[el] += 1;

  const total = elements.length || 1;
  const balance = Object.fromEntries(
    ELEMENT_ORDER.map((el) => [el, counts[el] / total]),
  ) as Record<FiveElement, number>;

  const neededElement = ELEMENT_ORDER.reduce((min, el) =>
    counts[el] < counts[min] ? el : min,
  );

  return { balance, neededElement, usedTimePillar };
}
