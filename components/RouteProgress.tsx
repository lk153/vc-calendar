"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      setVisible(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setVisible(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onHide() { setVisible(false); }
    window.addEventListener("pageshow", onHide);
    return () => window.removeEventListener("pageshow", onHide);
  }, []);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-tertiary/50 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
      role="status"
      aria-live="polite"
    >
      <div className="px-md py-sm rounded-full bg-tertiary/80 backdrop-blur-md flex items-center gap-sm shadow-soft-lg ring-1 ring-white/10">
        <span className="flex items-center gap-1">
          <Dot delay="0ms" />
          <Dot delay="160ms" />
          <Dot delay="320ms" />
        </span>
        <span className="text-caption text-white/80 uppercase tracking-wider font-bold">Đang tải</span>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-primary-container animate-bounce"
      style={{ animationDelay: delay, animationDuration: "0.9s" }}
    />
  );
}
