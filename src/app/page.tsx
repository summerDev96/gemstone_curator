import Image from "next/image";
import Link from "next/link";
import { EntryModeButtons } from "@/components/EntryModeButtons";
import { TrackView } from "@/components/TrackView";

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <TrackView event="landing_view" />
      <header className="py-6 text-center">
        <p className="text-lg font-semibold text-text-primary">원석 큐레이터</p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="h-40 w-40 overflow-hidden rounded-full bg-accent-primary/10">
          <Image
            src="/images/jewelry/chalcedony.png"
            alt="칼세도니 원석"
            width={320}
            height={320}
            className="h-full w-full object-cover"
            priority
          />
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
        <EntryModeButtons />
      </div>

      <section aria-label="서비스 소개" className="py-8">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-text-primary">
          <span>소원</span>
          <span aria-hidden="true" className="text-text-secondary">
            →
          </span>
          <span>오행</span>
          <span aria-hidden="true" className="text-text-secondary">
            →
          </span>
          <span>관계</span>
        </div>
        <p className="pt-2 text-center text-sm text-text-secondary">
          지금 바라는 마음부터 오행으로 더 깊이, 소중한 인연까지 순서대로 알아볼 수 있어요.
        </p>
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
