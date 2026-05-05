import Link from "next/link";
import { Icon } from "@/components/Icon";

export type Crumb = { href: string; label: string };

export function PageHeader({
  pillIcon,
  pillLabel,
  title,
  accent,
  description,
  crumbs,
  trailing,
}: {
  pillIcon?: string;
  pillLabel?: string;
  title: string;
  accent?: string;
  description?: string;
  crumbs?: Crumb[];
  trailing?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface mb-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 w-[26rem] h-[26rem] rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.55), transparent 72%)" }}
      />
      <div className="relative px-md md:px-lg py-md">
        {crumbs && crumbs.length > 0 && (
          <nav className="flex items-center gap-xs text-caption text-on-surface-variant mb-sm">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-xs">
                <Link href={c.href} className="hover:text-on-surface transition-colors">
                  {c.label}
                </Link>
                {i < crumbs.length - 1 && <Icon name="chevron_right" className="text-[14px] text-outline" />}
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-end justify-between gap-md flex-wrap">
          <div className="max-w-2xl">
            {pillLabel && (
              <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface text-on-primary-container border border-primary-container/60 text-caption font-bold uppercase tracking-wider shadow-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {pillIcon && <Icon name={pillIcon} className="text-[14px]" />}
                {pillLabel}
              </span>
            )}
            <h1 className="font-manrope font-bold text-headline-lg md:text-headline-xl text-on-surface mt-sm leading-tight">
              {title} {accent && <span className="text-primary">{accent}</span>}
            </h1>
            {description && <p className="text-body-md md:text-body-lg text-on-surface-variant mt-xs">{description}</p>}
          </div>
          {trailing && <div className="flex items-center gap-sm">{trailing}</div>}
        </div>
      </div>
    </header>
  );
}
