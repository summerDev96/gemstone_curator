"use client";

import { useId } from "react";

const MAX_LENGTH = 300;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function OptionalFreeTextArea({ value, onChange }: Props) {
  const id = useId();
  const counterId = `${id}-counter`;
  const overLimit = value.length > MAX_LENGTH;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        더 하고 싶은 말이 있다면 적어주세요 (선택)
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={counterId}
        aria-invalid={overLimit}
        rows={4}
        className={`min-h-[96px] w-full rounded-[var(--radius-sm)] border px-3 py-2 text-base text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          overLimit ? "border-danger" : "border-border-subtle"
        }`}
      />
      <p
        id={counterId}
        className={`text-right text-sm ${overLimit ? "text-danger" : "text-text-secondary"}`}
      >
        {value.length}/{MAX_LENGTH}
        {overLimit && " — 300자를 초과했어요"}
      </p>
    </div>
  );
}
