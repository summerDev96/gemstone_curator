import { describe, expect, it } from "vitest";
import {
  DESIRE_GROUP_STONE_SLUGS,
  PURPOSE_GROUP_MAP,
  stonesForDesire,
} from "./mapping";

describe("stonesForDesire", () => {
  it("사랑과 연애는 같은 love_romance 그룹을 공유해 동일한 후보를 반환한다", () => {
    expect(stonesForDesire("love")).toEqual(stonesForDesire("romance"));
  });

  it("건강과 활력은 같은 health_vitality 그룹을 공유한다", () => {
    expect(stonesForDesire("health")).toEqual(stonesForDesire("vitality"));
  });

  it("힐링과 대인관계는 같은 healing_relationships 그룹을 공유한다", () => {
    expect(stonesForDesire("healing")).toEqual(stonesForDesire("relationships"));
  });

  it("수호와 방어는 같은 protection_defense 그룹을 공유한다", () => {
    expect(stonesForDesire("protection")).toEqual(stonesForDesire("defense"));
  });

  it("학업은 단독 그룹이다", () => {
    expect(PURPOSE_GROUP_MAP.study).toBe("study");
  });

  it("모든 목적 그룹은 최소 1개 이상의 원석 후보를 가진다", () => {
    for (const slugs of Object.values(DESIRE_GROUP_STONE_SLUGS)) {
      expect(slugs.length).toBeGreaterThan(0);
    }
  });

  it("사랑을 선택하면 매핑 표 순서 그대로 후보를 반환한다", () => {
    expect(stonesForDesire("love")).toEqual([
      "turquoise",
      "amazonite",
      "lapis-lazuli",
      "sapphire",
      "garnet",
      "jade",
    ]);
  });
});
