"use client";

export interface TagOption {
  id: string;
  label: string;
}

interface Props {
  legend: string;
  options: TagOption[];
  value: string | null;
  onChange: (id: string) => void;
  name: string;
}

/**
 * 네이티브 radio input을 시각적으로 칩 형태로 감싼 컴포넌트.
 * 네이티브 radio 그룹의 화살표 키 이동/포커스 관리를 그대로 활용해
 * 별도 ARIA roving-tabindex 구현 없이 키보드 접근성을 보장한다 (NFR-A11Y-002).
 */
export function TagChipGroup({ legend, options, value, onChange, name }: Props) {
  return (
    <fieldset className="w-full border-0 p-0 m-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const selected = value === option.id;
          const inputId = `${name}-${option.id}`;
          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={`inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center rounded-[var(--radius-full)] border px-4 py-2 text-base transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-primary ${
                selected
                  ? "border-accent-primary bg-accent-primary/10 font-medium text-accent-primary"
                  : "border-border-subtle bg-bg-surface text-text-primary hover:border-accent-primary/50"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              {selected ? "✓ " : ""}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
