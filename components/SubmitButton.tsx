"use client";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/Icon";

type Variant = "primary" | "ghost" | "danger" | "outline-danger" | "outline-primary";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-soft hover:shadow-soft-lg hover:opacity-95",
  ghost:
    "bg-surface-container text-on-surface hover:bg-surface-container-high",
  danger:
    "bg-error text-on-error shadow-soft hover:shadow-soft-lg hover:opacity-95",
  "outline-danger":
    "text-error border border-error/30 hover:bg-error/10",
  "outline-primary":
    "text-primary border border-primary/30 hover:bg-primary/10",
};

export function SubmitButton({
  children,
  icon,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  icon?: string;
  pendingLabel?: string;
  variant?: Variant;
  size?: "sm" | "md";
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const { pending } = useFormStatus();
  const sizeCls = size === "sm" ? "h-9 px-sm text-label-md" : "h-12 px-md text-body-md";
  return (
    <button
      type="submit"
      {...rest}
      disabled={pending || disabled}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-xs rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${sizeCls} ${VARIANT[variant]} ${className}`}
    >
      {pending ? (
        <>
          <Icon name="progress_activity" className="animate-spin text-[18px]" />
          {pendingLabel ?? "Working…"}
        </>
      ) : (
        <>
          {icon && <Icon name={icon} className="text-[18px]" />}
          {children}
        </>
      )}
    </button>
  );
}
