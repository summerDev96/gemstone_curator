import { describe, expect, it } from "vitest";
import { calculateFiveElements } from "./calculate";

describe("calculateFiveElements", () => {
  it("동일 입력은 항상 동일한 결과를 반환한다 (결정론)", () => {
    const input = {
      calendarType: "SOLAR" as const,
      year: 1996,
      month: 4,
      day: 12,
      birthTimeUnknown: false,
      hour: 14,
      minute: 30,
    };
    const first = calculateFiveElements(input);
    for (let i = 0; i < 5; i++) {
      expect(calculateFiveElements(input)).toEqual(first);
    }
  });

  it("balance 비율의 합은 1.0이다", () => {
    const result = calculateFiveElements({
      calendarType: "SOLAR",
      year: 2000,
      month: 1,
      day: 1,
      birthTimeUnknown: true,
    });
    const sum = Object.values(result.balance).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("출생시간 미상이면 시주를 제외하고 6자만 사용한다", () => {
    const result = calculateFiveElements({
      calendarType: "SOLAR",
      year: 1990,
      month: 6,
      day: 15,
      birthTimeUnknown: true,
    });
    expect(result.usedTimePillar).toBe(false);
    const totalCount = Object.values(result.balance).reduce(
      (a, b) => a + b,
      0,
    );
    expect(totalCount).toBeCloseTo(1.0, 5);
  });

  it("출생시간을 알면 시주를 포함해 8자를 사용한다", () => {
    const result = calculateFiveElements({
      calendarType: "SOLAR",
      year: 1990,
      month: 6,
      day: 15,
      birthTimeUnknown: false,
      hour: 10,
      minute: 0,
    });
    expect(result.usedTimePillar).toBe(true);
  });

  it("동일한 실제 날짜는 양력/음력 입력 방식과 무관하게 같은 결과를 낸다", () => {
    // 1996-04-12(양력) == 1996년 음력 2월 25일
    const bySolar = calculateFiveElements({
      calendarType: "SOLAR",
      year: 1996,
      month: 4,
      day: 12,
      birthTimeUnknown: true,
    });
    const byLunar = calculateFiveElements({
      calendarType: "LUNAR",
      year: 1996,
      month: 2,
      day: 25,
      birthTimeUnknown: true,
    });
    expect(byLunar).toEqual(bySolar);
  });

  it("윤달 여부에 따라 다른 실제 날짜로 계산된다", () => {
    // 2023년은 윤2월이 존재
    const normal = calculateFiveElements({
      calendarType: "LUNAR",
      year: 2023,
      month: 2,
      day: 15,
      isLeapMonth: false,
      birthTimeUnknown: true,
    });
    const leap = calculateFiveElements({
      calendarType: "LUNAR",
      year: 2023,
      month: 2,
      day: 15,
      isLeapMonth: true,
      birthTimeUnknown: true,
    });
    expect(normal).not.toEqual(leap);
  });

  it("neededElement는 항상 balance에서 가장 낮은 값을 가진 원소 중 하나다", () => {
    const result = calculateFiveElements({
      calendarType: "SOLAR",
      year: 2010,
      month: 9,
      day: 3,
      birthTimeUnknown: false,
      hour: 5,
      minute: 45,
    });
    const minValue = Math.min(...Object.values(result.balance));
    expect(result.balance[result.neededElement]).toBeCloseTo(minValue, 5);
  });
});
