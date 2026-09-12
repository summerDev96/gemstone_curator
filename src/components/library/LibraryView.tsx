"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";

interface HistoryItem {
  id: string;
  stone: { nameKo: string; nameEn: string; colorHex: string };
  createdAt: string;
  hasFiveElements: boolean;
}

type Tab = "history" | "settings";

export function LibraryView() {
  const [tab, setTab] = useState<Tab>("history");
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/v1/recommendations")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const body = await res.json();
        setItems(body.items);
      })
      .catch(() => setError("보관함을 불러오지 못했어요."));
  }, []);

  function selectTab(next: Tab) {
    setTab(next);
    track("library_tab_switch", { tab: next });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <TrackView event="library_view" />
      <h1 className="text-xl font-semibold text-text-primary">보관함</h1>

      <div role="tablist" aria-label="보관함 메뉴" className="mt-4 flex gap-2 border-b border-border-subtle">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => selectTab("history")}
          className={`min-h-[44px] px-3 text-base ${
            tab === "history"
              ? "border-b-2 border-accent-primary font-medium text-accent-primary"
              : "text-text-secondary"
          }`}
        >
          보관함
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "settings"}
          onClick={() => selectTab("settings")}
          className={`min-h-[44px] px-3 text-base ${
            tab === "settings"
              ? "border-b-2 border-accent-primary font-medium text-accent-primary"
              : "text-text-secondary"
          }`}
        >
          개인정보 설정
        </button>
      </div>

      {tab === "history" && (
        <div role="tabpanel" className="flex flex-col gap-3 py-6">
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          {!items && !error && (
            <p className="text-sm text-text-secondary">불러오는 중...</p>
          )}
          {items?.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-text-secondary">아직 저장된 결과가 없어요.</p>
              <Link href="/" className="text-accent-primary underline">
                지금 시작하기
              </Link>
            </div>
          )}
          {items?.map((item) => (
            <Link
              key={item.id}
              href={item.hasFiveElements ? `/result/${item.id}/five-elements` : `/result/${item.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-3"
            >
              <div
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-full"
                style={{ backgroundColor: item.stone.colorHex }}
              />
              <div className="flex flex-col">
                <span className="font-medium text-text-primary">{item.stone.nameKo}</span>
                <span className="text-xs text-text-secondary">
                  {new Date(item.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                  {item.hasFiveElements ? " · 오행 분석 포함" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div role="tabpanel" className="flex flex-col gap-4 py-6">
          <p className="text-sm text-text-secondary">
            이 서비스는 로그인 없이 이 브라우저(기기) 단위로 결과를 보관해요. 다른
            기기에서는 이 보관함을 볼 수 없어요.
          </p>
          <Link
            href="/privacy"
            className="flex min-h-[48px] items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle text-base text-danger"
          >
            내 데이터 삭제
          </Link>
        </div>
      )}
    </main>
  );
}
