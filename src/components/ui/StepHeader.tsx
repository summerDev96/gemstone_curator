"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Props {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export function StepHeader({ step, totalSteps, onBack, rightSlot }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between py-4">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : router.back())}
        aria-label="뒤로 가기"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-text-primary hover:bg-bg-surface"
      >
        ←
      </button>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">
          {step} / {totalSteps}
        </span>
        {rightSlot}
      </div>
    </div>
  );
}
