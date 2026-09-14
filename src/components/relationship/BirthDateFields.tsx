"use client";

export interface BirthDateFieldsValue {
  calendarType: "SOLAR" | "LUNAR";
  year: string;
  month: string;
  day: string;
  birthTimeUnknown: boolean;
  hour: string;
  minute: string;
}

interface Props {
  idPrefix: string;
  ariaLabelPrefix: string;
  value: BirthDateFieldsValue;
  onChange: (next: Partial<BirthDateFieldsValue>) => void;
}

export function isBirthDateFieldsValid(value: BirthDateFieldsValue): boolean {
  const dateValid =
    value.year.length === 4 &&
    Number(value.month) >= 1 &&
    Number(value.month) <= 12 &&
    Number(value.day) >= 1 &&
    Number(value.day) <= 31;
  const timeValid =
    value.birthTimeUnknown ||
    (value.hour !== "" &&
      value.minute !== "" &&
      Number(value.hour) <= 23 &&
      Number(value.minute) <= 59);
  return dateValid && timeValid;
}

/** 나/상대방 생년월일시 입력에 공통으로 쓰는 필드 묶음. */
export function BirthDateFields({ idPrefix, ariaLabelPrefix, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex gap-4 border-0 p-0 m-0">
        <legend className="sr-only">{ariaLabelPrefix} 달력 유형</legend>
        {(["SOLAR", "LUNAR"] as const).map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="radio"
              name={`${idPrefix}-calendarType`}
              checked={value.calendarType === type}
              onChange={() => onChange({ calendarType: type })}
              className="h-5 w-5 accent-[var(--color-accent-primary)]"
            />
            {type === "SOLAR" ? "양력" : "음력"}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <input
          aria-label={`${ariaLabelPrefix} 생년`}
          inputMode="numeric"
          placeholder="연(YYYY)"
          value={value.year}
          onChange={(e) => onChange({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          className="min-h-[48px] w-full rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
        />
        <input
          aria-label={`${ariaLabelPrefix} 생월`}
          inputMode="numeric"
          placeholder="월"
          value={value.month}
          onChange={(e) => onChange({ month: e.target.value.replace(/\D/g, "").slice(0, 2) })}
          className="min-h-[48px] w-24 rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
        />
        <input
          aria-label={`${ariaLabelPrefix} 생일`}
          inputMode="numeric"
          placeholder="일"
          value={value.day}
          onChange={(e) => onChange({ day: e.target.value.replace(/\D/g, "").slice(0, 2) })}
          className="min-h-[48px] w-24 rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={value.birthTimeUnknown}
          onChange={(e) => onChange({ birthTimeUnknown: e.target.checked })}
          className="h-5 w-5 accent-[var(--color-accent-primary)]"
        />
        태어난 시간을 몰라요
      </label>
      {!value.birthTimeUnknown && (
        <div className="flex gap-2">
          <input
            aria-label={`${ariaLabelPrefix} 태어난 시`}
            inputMode="numeric"
            placeholder="시(0~23)"
            value={value.hour}
            onChange={(e) => onChange({ hour: e.target.value.replace(/\D/g, "").slice(0, 2) })}
            className="min-h-[48px] w-full rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
          />
          <input
            aria-label={`${ariaLabelPrefix} 태어난 분`}
            inputMode="numeric"
            placeholder="분(0~59)"
            value={value.minute}
            onChange={(e) => onChange({ minute: e.target.value.replace(/\D/g, "").slice(0, 2) })}
            className="min-h-[48px] w-full rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
          />
        </div>
      )}
    </div>
  );
}
