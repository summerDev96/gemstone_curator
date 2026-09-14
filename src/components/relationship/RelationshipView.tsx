"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StepHeader } from "@/components/ui/StepHeader";
import { ShareButton } from "@/components/result/ShareButton";
import {
  BirthDateFields,
  isBirthDateFieldsValid,
  type BirthDateFieldsValue,
} from "@/components/relationship/BirthDateFields";
import { StoneAvatar } from "@/components/ui/StoneAvatar";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";

type RelationshipType = "FAMILY" | "FRIEND" | "ROMANTIC" | "COLLEAGUE" | "OTHER";

const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  FAMILY: "가족",
  FRIEND: "친구",
  ROMANTIC: "연인",
  COLLEAGUE: "동료",
  OTHER: "기타",
};

const EMPTY_BIRTH_FIELDS: BirthDateFieldsValue = {
  calendarType: "SOLAR",
  year: "",
  month: "",
  day: "",
  birthTimeUnknown: true,
  hour: "",
  minute: "",
};

interface RelationshipGoalTag {
  id: string;
  slug: string;
  labelKo: string;
}

interface RelationshipStone {
  id: string;
  nameKo: string;
  nameEn: string;
  colorHex: string;
  imageUrl: string | null;
}

interface RelationshipResult {
  relationshipAnalysisId: string;
  myStone: RelationshipStone;
  partnerStone: RelationshipStone;
  weStone: RelationshipStone;
  conversationPrompt: string;
  microAction: string;
  usedFallback: boolean;
}

type Step = "checking" | "intro" | "form" | "loading" | "result" | "error";

function toBirthInfoPayload(value: BirthDateFieldsValue) {
  return {
    calendarType: value.calendarType,
    birthDate: `${value.year.padStart(4, "0")}-${value.month.padStart(2, "0")}-${value.day.padStart(2, "0")}`,
    isLeapMonth: false,
    birthTimeUnknown: value.birthTimeUnknown,
    birthTime: value.birthTimeUnknown
      ? undefined
      : `${value.hour.padStart(2, "0")}:${value.minute.padStart(2, "0")}`,
  };
}

export function RelationshipView({ id }: { id: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("checking");
  const [goals, setGoals] = useState<RelationshipGoalTag[]>([]);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [needsMyBirthInfo, setNeedsMyBirthInfo] = useState(true);

  const [relationshipType, setRelationshipType] = useState<RelationshipType>("FRIEND");
  const [relationshipGoalTagId, setRelationshipGoalTagId] = useState("");
  const [partnerNickname, setPartnerNickname] = useState("");
  const [myBirth, setMyBirth] = useState<BirthDateFieldsValue>(EMPTY_BIRTH_FIELDS);
  const [partnerBirth, setPartnerBirth] = useState<BirthDateFieldsValue>(EMPTY_BIRTH_FIELDS);

  useEffect(() => {
    apiFetch("/api/v1/catalog/wishes")
      .then(async (res) => {
        if (!res.ok) return;
        const body = await res.json();
        setGoals(body.relationshipGoals ?? []);
      })
      .catch(() => {});
  }, []);

  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    apiFetch(`/api/v1/recommendations/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const body = await res.json();
        // 사용자가 응답을 기다리는 동안 이미 다음 단계로 진행했다면(느린 네트워크 등)
        // 여기서 되돌리지 않는다 — 입력 중이던 내용을 덮어쓰는 것을 방지.
        if (stepRef.current !== "checking") return;
        setNeedsMyBirthInfo(!body.fiveElements);
        const latest = body.relationships?.[0] ?? null;
        if (latest) {
          setResult(latest);
          setStep("result");
        } else {
          setStep("intro");
        }
      })
      .catch(() => {
        if (stepRef.current === "checking") setStep("intro");
      });
  }, [id]);

  const canSubmit =
    relationshipGoalTagId !== "" &&
    partnerNickname.trim() !== "" &&
    (!needsMyBirthInfo || isBirthDateFieldsValid(myBirth)) &&
    isBirthDateFieldsValid(partnerBirth);

  async function handleSubmit() {
    if (!canSubmit) return;
    setStep("loading");
    track("relationship_submitted");

    try {
      const res = await apiFetch(`/api/v1/recommendations/${id}/relationship`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          relationshipType,
          relationshipGoalTagId,
          partnerNickname: partnerNickname.trim(),
          myBirthInfo: needsMyBirthInfo ? toBirthInfoPayload(myBirth) : undefined,
          partnerBirthInfo: toBirthInfoPayload(partnerBirth),
        }),
      });
      if (!res.ok) {
        setStep("error");
        return;
      }
      const body = (await res.json()) as RelationshipResult;
      setResult(body);
      setStep("result");
    } catch {
      setStep("error");
    }
  }

  if (step === "checking") {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      </main>
    );
  }

  if (step === "intro") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <TrackView event="relationship_intro_view" />
        <StepHeader step={1} totalSteps={2} onBack={() => router.push(`/result/${id}`)} />
        <h1 className="pt-2 text-xl font-semibold text-text-primary">
          소중한 인연과의 원석을 알아볼까요?
        </h1>
        <p className="pt-2 text-base text-text-secondary">
          나와 상대방의 생년월일시로 사주를 함께 비교해, 두 분을 위한 &lsquo;우리의
          원석&rsquo;을 찾아드려요.
        </p>
        <div className="mt-auto flex flex-col gap-3 py-6">
          <PrimaryButton onClick={() => setStep("form")}>시작하기</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => router.push(`/result/${id}`)}>
            다음에 할게요
          </PrimaryButton>
        </div>
      </main>
    );
  }

  if (step === "form") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <TrackView event="relationship_form_view" />
        <StepHeader step={2} totalSteps={2} onBack={() => setStep("intro")} />
        <h1 className="pt-2 text-xl font-semibold text-text-primary">
          어떤 관계인가요?
        </h1>

        <fieldset className="flex flex-wrap gap-2 border-0 p-0 pt-4">
          <legend className="sr-only">관계 유형</legend>
          {(Object.keys(RELATIONSHIP_TYPE_LABEL) as RelationshipType[]).map((type) => (
            <label key={type}>
              <input
                type="radio"
                name="relationshipType"
                className="peer sr-only"
                checked={relationshipType === type}
                onChange={() => setRelationshipType(type)}
              />
              <span className="block cursor-pointer rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary peer-checked:border-accent-primary peer-checked:bg-accent-primary/10">
                {RELATIONSHIP_TYPE_LABEL[type]}
              </span>
            </label>
          ))}
        </fieldset>

        <label className="pt-6 text-sm font-medium text-text-primary" htmlFor="partnerNickname">
          상대방을 어떻게 부를까요?
        </label>
        <input
          id="partnerNickname"
          value={partnerNickname}
          onChange={(e) => setPartnerNickname(e.target.value.slice(0, 20))}
          placeholder="별명(최대 20자)"
          className="mt-2 min-h-[48px] rounded-[var(--radius-sm)] border border-border-subtle px-3 text-base"
        />

        <fieldset className="flex flex-col gap-2 border-0 p-0 pt-6">
          <legend className="text-sm font-medium text-text-primary">
            어떤 마음을 바라시나요?
          </legend>
          {goals.map((goal) => (
            <label key={goal.id} className="flex items-center gap-2 text-base text-text-primary">
              <input
                type="radio"
                name="relationshipGoal"
                checked={relationshipGoalTagId === goal.id}
                onChange={() => setRelationshipGoalTagId(goal.id)}
                className="h-5 w-5 accent-[var(--color-accent-primary)]"
              />
              {goal.labelKo}
            </label>
          ))}
        </fieldset>

        {needsMyBirthInfo && (
          <div className="pt-6">
            <h2 className="pb-3 text-sm font-medium text-text-primary">나의 생년월일시</h2>
            <BirthDateFields
              idPrefix="my"
              ariaLabelPrefix="나의"
              value={myBirth}
              onChange={(patch) => setMyBirth((prev) => ({ ...prev, ...patch }))}
            />
          </div>
        )}

        <div className="pt-6">
          <h2 className="pb-3 text-sm font-medium text-text-primary">상대방의 생년월일시</h2>
          <BirthDateFields
            idPrefix="partner"
            ariaLabelPrefix="상대방"
            value={partnerBirth}
            onChange={(patch) => setPartnerBirth((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <div className="py-6">
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
            우리의 원석 보기
          </PrimaryButton>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          className="h-16 w-16 animate-pulse rounded-full bg-accent-primary/20 motion-reduce:animate-none"
        />
        <p className="text-base text-text-secondary">우리의 원석을 찾고 있어요...</p>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base text-text-secondary">결과를 만드는 중 문제가 생겼어요.</p>
        <PrimaryButton onClick={handleSubmit}>다시 시도</PrimaryButton>
      </main>
    );
  }

  if (!result) return null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="relationship_result_view" />
      <StepHeader step={2} totalSteps={2} onBack={() => router.push(`/result/${id}`)} />

      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <StoneAvatar
          imageUrl={result.weStone.imageUrl}
          colorHex={result.weStone.colorHex}
          alt={result.weStone.nameKo}
          size={112}
        />
        <h1 className="text-lg font-semibold text-text-primary">
          {result.weStone.nameKo}
          <span className="pl-2 text-sm font-normal text-text-secondary">
            {result.weStone.nameEn}
          </span>
        </h1>
        <p className="text-sm text-text-secondary">우리의 원석</p>
      </section>

      <div className="flex justify-center gap-6 py-2 text-center text-xs text-text-secondary">
        <span>
          <span
            aria-hidden="true"
            className="mb-1 block h-4 w-4 rounded-full"
            style={{ backgroundColor: result.myStone.colorHex }}
          />
          나: {result.myStone.nameKo}
        </span>
        <span>
          <span
            aria-hidden="true"
            className="mb-1 block h-4 w-4 rounded-full"
            style={{ backgroundColor: result.partnerStone.colorHex }}
          />
          상대: {result.partnerStone.nameKo}
        </span>
      </div>

      <div className="flex flex-col gap-6 py-4">
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">대화를 시작해보세요</h2>
          <p className="text-base text-text-primary">{result.conversationPrompt}</p>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">오늘의 작은 행동</h2>
          <p className="text-base text-text-primary">{result.microAction}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-8 pt-6">
        <p className="text-center text-xs text-text-secondary">
          이 결과는 이 브라우저의{" "}
          <Link href="/library" className="text-accent-primary underline">
            보관함
          </Link>
          에서 다시 볼 수 있어요.
        </p>
        <ShareButton
          recommendationId={id}
          scope="relationship"
          relationshipAnalysisId={result.relationshipAnalysisId}
        />
        <PrimaryButton variant="secondary" onClick={() => router.push("/")}>
          처음으로
        </PrimaryButton>
      </div>
    </main>
  );
}
