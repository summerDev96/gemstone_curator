"use client";

import type { TagOption } from "@/components/ui/TagChipGroup";

interface Props {
  legend: string;
  options: TagOption[];
  value: string | null;
  onChange: (id: string) => void;
  name: string;
}

export function HeartOptionList({ legend, options, value, onChange, name }: Props) {
  return (
    <fieldset className="w-full border-0 p-0 m-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          const inputId = `${name}-${option.id}`;
          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-base transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-primary ${
                selected
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-border-subtle bg-bg-surface hover:border-accent-primary/50"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="h-5 w-5 accent-[var(--color-accent-primary)]"
              />
              <span className="text-text-primary">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
