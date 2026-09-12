"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StepHeader } from "@/components/ui/StepHeader";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";
import { CURRENT_FIVE_ELEMENTS_CONSENT_VERSION } from "@/lib/validation/fiveElements";

type CalendarType = "SOLAR" | "LUNAR";

export function BirthInfoView({ id }: { id: string }) {
  const router = useRouter();
  const [calendarType, setCalendarType] = useState<CalendarType>("SOLAR");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);
  const hourNum = Number(hour);
  const minuteNum = Number(minute);

  const dateValid =
    year.length === 4 &&
    yearNum >= 1900 &&
    yearNum <= new Date().getFullYear() &&
    monthNum >= 1 &&
    monthNum <= 12 &&
    dayNum >= 1 &&
    dayNum <= 31;
  const timeValid =
    birthTimeUnknown ||
    (hour !== "" &&
      minute !== "" &&
      hourNum >= 0 &&
      hourNum <= 23 &&
      minuteNum >= 0 &&
      minuteNum <= 59);
  const canSubmit = dateValid && timeValid && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    track("birth_info_submitted");
    if (birthTimeUnknown) track("birth_time_unknown_selected");

    const birthDate = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const birthTime = birthTimeUnknown
      ? undefined
      : `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

    try {
      const res = await apiFetch(`/api/v1/recommendations/${id}/five-elements`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consent: true,
          consentVersion: CURRENT_FIVE_ELEMENTS_CONSENT_VERSION,
          calendarType,
          birthDate,
          isLeapMonth: calendarType === "LUNAR" ? isLeapMonth : undefined,
          birthTimeUnknown,
          birthTime,
        }),
      });
      if (!res.ok) {
        setError("입력값을 다시 확인해주세요.");
        setSubmitting(false);
        return;
      }
      router.push(`/result/${id}/five-elements`);
    } catch {
      setError("오행 결과를 만드는 중 문제가 생겼어요.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="birth_info_view" />
      <StepHeader step={2} totalSteps={3} />

      <h1 className="pt-2 text-xl font-semibold text-text-primary">
        생년월일시를 알려주세요
      </h1>

      <div className="flex flex-col gap-6 py-6">
        <fieldset className="flex gap-4 border-0 p-0 m-0">
          <legend className="sr-only">달력 유형</legend>
          {(["SOLAR", "LUNAR"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-base text-text-primary">
              <input
                type="radio"
                name="calendarType"
                checked={calendarType === type}
                onChange={() => setCalendarType(type)}
                className="h-5 w-5 accent-[var(--color-accent-primary)]"
              />
              {type === "SOLAR" ? "양력" : "음력"}
            </label>
          ))}
        </fieldset>

        <div className="flex gap-2">
          <input
            aria-label="연"
            inputMode="numeric"
            placeholder="연(YYYY)"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="min-h-[48px] w-full rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
          />
          <input
            aria-label="월"
            inputMode="numeric"
            placeholder="월"
            value={month}
            onChange={(e) => setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="min-h-[48px] w-24 rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
          />
          <input
            aria-label="일"
            inputMode="numeric"
            placeholder="일"
            value={day}
            onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="min-h-[48px] w-24 rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
          />
        </div>

        {calendarType === "LUNAR" && (
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={isLeapMonth}
              onChange={(e) => setIsLeapMonth(e.target.checked)}
              className="h-5 w-5 accent-[var(--color-accent-primary)]"
            />
            윤달이에요
          </label>
        )}

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={birthTimeUnknown}
            onChange={(e) => setBirthTimeUnknown(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-accent-primary)]"
          />
          태어난 시간을 몰라요
        </label>

        {!birthTimeUnknown && (
          <div className="flex gap-2">
            <input
              aria-label="시"
              inputMode="numeric"
              placeholder="시(0~23)"
              value={hour}
              onChange={(e) => setHour(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="min-h-[48px] w-full rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
            />
            <input
              aria-label="분"
              inputMode="numeric"
              placeholder="분(0~59)"
              value={minute}
              onChange={(e) => setMinute(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="min-h-[48px] w-full rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="mt-auto py-6">
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? "만드는 중..." : "오행 결과 보기"}
        </PrimaryButton>
      </div>
    </main>
  );
}
