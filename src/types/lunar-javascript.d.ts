/**
 * lunar-javascript는 TypeScript 타입을 제공하지 않으므로,
 * 이 프로젝트(src/lib/fiveElements)에서 실제로 사용하는 API만 최소 선언한다.
 */
declare module "lunar-javascript" {
  export class EightChar {
    getYear(): string;
    getYearWuXing(): string;
    getMonth(): string;
    getMonthWuXing(): string;
    getDay(): string;
    getDayWuXing(): string;
    getTime(): string;
    getTimeWuXing(): string;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
    getEightChar(): EightChar;
  }

  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    toString(): string;
    getLunar(): Lunar;
  }
}
