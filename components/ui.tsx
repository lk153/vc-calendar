import { Icon } from "@/components/Icon";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-surface border border-surface-variant rounded-xl shadow-soft ${className}`}>{children}</section>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
  icon,
}: {
  tone?: "primary" | "neutral" | "warning" | "danger";
  children: React.ReactNode;
  icon?: string;
}) {
  const toneCls = {
    primary: "bg-primary-container text-on-primary-container",
    neutral: "bg-surface-variant text-on-surface-variant",
    warning: "bg-error-container/60 text-on-error-container",
    danger: "bg-error-container text-on-error-container",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full text-caption font-bold uppercase tracking-wider whitespace-nowrap ${toneCls}`}>
      {icon && <Icon name={icon} className="text-[14px]" />}
      {children}
    </span>
  );
}

export function PrimaryButton({
  href,
  children,
  icon,
  ...rest
}: {
  href?: string;
  children: React.ReactNode;
  icon?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    "inline-flex items-center justify-center gap-xs bg-primary text-on-primary px-md py-sm rounded-lg font-semibold shadow-soft hover:shadow-soft-lg hover:opacity-95 transition-all disabled:opacity-50 whitespace-nowrap";
  if (href) {
    return (
      <a href={href} className={cls}>
        {icon && <Icon name={icon} className="text-[18px]" />} {children}
      </a>
    );
  }
  return (
    <button {...rest} className={cls}>
      {icon && <Icon name={icon} className="text-[18px]" />} {children}
    </button>
  );
}

export function GhostButton({
  href,
  children,
  icon,
  ...rest
}: {
  href?: string;
  children: React.ReactNode;
  icon?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    "inline-flex items-center justify-center gap-xs bg-surface-container-low text-on-surface border border-outline-variant px-md py-sm rounded-lg font-semibold hover:bg-surface-container transition-colors disabled:opacity-50 whitespace-nowrap";
  if (href) {
    return (
      <a href={href} className={cls}>
        {icon && <Icon name={icon} className="text-[18px]" />} {children}
      </a>
    );
  }
  return (
    <button {...rest} className={cls}>
      {icon && <Icon name={icon} className="text-[18px]" />} {children}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  trail,
  bar,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  trail?: React.ReactNode;
  bar?: { pct: number };
}) {
  return (
    <div className="relative bg-surface border border-surface-variant rounded-xl shadow-soft p-md flex flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.4), transparent 70%)" }}
      />
      <div className="relative flex items-center justify-between mb-sm">
        <span className="text-label-md uppercase text-on-surface-variant">{label}</span>
        <span className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-[18px]" />
        </span>
      </div>
      <div className="relative font-manrope font-bold text-headline-xl text-on-surface mt-auto leading-none">{value}</div>
      {bar && (
        <div className="relative w-full bg-surface-variant h-1.5 mt-sm rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, bar.pct)}%` }} />
        </div>
      )}
      {trail && <div className="relative text-caption text-on-surface-variant mt-xs flex items-center gap-xs">{trail}</div>}
    </div>
  );
}

export function EmptyHint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl px-md py-sm flex items-center gap-sm">
      <Icon name={icon} className="text-on-surface-variant" />
      <p className="text-body-sm text-on-surface-variant">{text}</p>
    </div>
  );
}

export function FilterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-surface-variant rounded-xl shadow-soft p-md flex flex-wrap gap-sm items-end mb-md">{children}</div>
  );
}

export const inputCls =
  "w-full h-12 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface placeholder:text-on-surface-variant/60 transition-colors outline-none";

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-label-md uppercase text-on-surface-variant flex items-center gap-xs mb-xs">
      {children}
      {required && <span className="text-error">*</span>}
    </span>
  );
}
