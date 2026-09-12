"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrackView } from "@/components/TrackView";

interface SharePayload {
  scope: string;
  stone: { nameKo: string; nameEn: string; colorHex: string };
  summary: string;
}

type ViewState =
  | { status: "loading" }
  | { status: "expired" }
  | { status: "not_found" }
  | { status: "error" }
  | { status: "ready"; data: SharePayload };

export function ShareView({ token }: { token: string }) {
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    fetch(`/api/v1/shares/${token}`)
      .then(async (res) => {
        if (res.status === 410) {
          setState({ status: "expired" });
          return;
        }
        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as SharePayload;
        setState({ status: "ready", data });
      })
      .catch(() => setState({ status: "error" }));
  }, [token]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      </main>
    );
  }

  if (state.status === "expired") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base text-text-secondary">만료된 공유입니다.</p>
        <Link href="/" className="text-accent-primary underline">
          나도 원석 추천받기
        </Link>
      </main>
    );
  }

  if (state.status === "not_found" || state.status === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base text-text-secondary">공유를 찾을 수 없어요.</p>
        <Link href="/" className="text-accent-primary underline">
          원석 큐레이터 시작하기
        </Link>
      </main>
    );
  }

  const { stone, summary } = state.data;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-8 text-center">
      <TrackView event="share_link_viewed" />
      <p className="pb-6 text-lg font-semibold text-text-primary">원석 큐레이터</p>

      <div
        aria-hidden="true"
        className="flex h-32 w-32 items-center justify-center rounded-full"
        style={{ backgroundColor: `${stone.colorHex}33` }}
      >
        <div className="h-20 w-20 rounded-full" style={{ backgroundColor: stone.colorHex }} />
      </div>
      <h1 className="pt-3 text-xl font-semibold text-text-primary">
        {stone.nameKo}
        <span className="pl-2 text-sm font-normal text-text-secondary">{stone.nameEn}</span>
      </h1>
      <p className="pt-4 text-base text-text-primary">{summary}</p>

      <Link
        href="/"
        className="mt-8 flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-accent-primary px-6 font-medium text-white hover:bg-accent-primary-hover"
      >
        나도 원석 추천받기
      </Link>
    </main>
  );
}
