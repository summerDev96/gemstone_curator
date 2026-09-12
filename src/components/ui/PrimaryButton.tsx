import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function PrimaryButton({
  variant = "primary",
  className = "",
  disabled,
  ...rest
}: Props) {
  const base =
    "min-h-[48px] w-full rounded-[var(--radius-sm)] px-6 font-medium text-base transition-colors disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-accent-primary text-white hover:bg-accent-primary-hover disabled:bg-border-subtle disabled:text-text-secondary"
      : "border border-border-subtle bg-bg-surface text-text-primary hover:bg-bg-base";

  return (
    <button
      className={`${base} ${styles} ${className}`}
      disabled={disabled}
      aria-disabled={disabled}
      {...rest}
    />
  );
}
