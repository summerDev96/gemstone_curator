"use client";

import { useState } from "react";
import Link from "next/link";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiFetch, clearStoredSessionToken } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";

type State = "idle" | "confirming" | "deleting" | "done" | "error";

export function DeleteMyDataView() {
  const [state, setState] = useState<State>("idle");
  const showConfirmUi = state === "confirming" || state === "deleting" || state === "error";

  async function handleDelete() {
    setState("deleting");
    track("data_deletion_requested");
    try {
      const res = await apiFetch("/api/v1/sessions/current", { method: "DELETE" });
      if (!res.ok && res.status !== 401) throw new Error("failed");
      clearStoredSessionToken();
      sessionStorage.clear();
      track("data_deletion_completed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <h1 className="text-xl font-semibold text-text-primary">내 데이터 삭제</h1>
      <p className="pt-3 text-base text-text-secondary">
        이 브라우저 세션으로 만든 원석 추천 결과, 오행 분석 결과(암호화된 생년월일시
        포함), 만족도, 공유 링크가 모두 삭제됩니다. 되돌릴 수 없어요.
      </p>

      {state === "done" && (
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-base text-success">삭제가 완료됐어요.</p>
          <Link href="/" className="text-accent-primary underline">
            처음으로 돌아가기
          </Link>
        </div>
      )}

      {!showConfirmUi && state === "idle" && (
        <div className="mt-6">
          <PrimaryButton variant="secondary" onClick={() => setState("confirming")}>
            내 데이터 삭제하기
          </PrimaryButton>
        </div>
      )}

      {showConfirmUi && (
        <div className="mt-6 flex flex-col gap-3">
          <p role="alert" className="text-sm text-danger">
            정말로 삭제할까요? 이 작업은 되돌릴 수 없어요.
          </p>
          <PrimaryButton onClick={handleDelete} disabled={state === "deleting"}>
            {state === "deleting" ? "삭제하는 중..." : "네, 삭제합니다"}
          </PrimaryButton>
          <PrimaryButton
            variant="secondary"
            onClick={() => setState("idle")}
            disabled={state === "deleting"}
          >
            취소
          </PrimaryButton>
          {state === "error" && (
            <p role="alert" className="text-sm text-danger">
              삭제하지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
