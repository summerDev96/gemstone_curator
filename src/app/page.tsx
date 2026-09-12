import Link from "next/link";
import { LandingCta } from "@/components/LandingCta";
import { TrackView } from "@/components/TrackView";

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <TrackView event="landing_view" />
      <header className="py-6 text-center">
        <p className="text-lg font-semibold text-text-primary">원석 큐레이터</p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
        <div
          aria-hidden="true"
          className="flex h-40 w-40 items-center justify-center rounded-full bg-accent-primary/10 text-5xl"
        >
          💎
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold leading-snug text-text-primary">
            당신의 바람과 기운,
            <br />
            인연을 잇는 원석
          </h1>
          <p className="text-base text-text-secondary">
            지금 마음을 짧게 나누면, 당신에게 어울리는 원석 하나를 찾아드려요.
          </p>
        </div>
      </section>

      <div className="pb-4">
        <LandingCta />
      </div>

      <section
        aria-label="서비스 소개"
        className="grid grid-cols-3 gap-3 py-8 text-center text-sm text-text-secondary"
      >
        <div className="rounded-[var(--radius-md)] border border-border-subtle p-3">
          <p className="font-medium text-text-primary">소원</p>
          <p>지금 바라는 것</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border-subtle p-3">
          <p className="font-medium text-text-primary">오행</p>
          <p>더 깊은 이해</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border-subtle p-3">
          <p className="font-medium text-text-primary">관계</p>
          <p>소중한 인연</p>
        </div>
      </section>

      <footer className="flex flex-col gap-2 py-4 text-center text-xs text-text-secondary">
        <p>
          원석 큐레이터는 문화적·상징적 자기성찰 콘텐츠를 제공하며,
          의학적·심리학적 진단이나 운명 예측을 제공하지 않습니다.
        </p>
        <span className="flex justify-center gap-3">
          <Link href="/library" className="text-accent-primary underline">
            보관함
          </Link>
          <Link href="/privacy" className="text-accent-primary underline">
            내 데이터 삭제
          </Link>
        </span>
      </footer>
    </main>
  );
}
