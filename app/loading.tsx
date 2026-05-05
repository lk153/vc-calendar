export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-tertiary/50 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="px-md py-sm rounded-full bg-tertiary/80 backdrop-blur-md flex items-center gap-sm shadow-soft-lg ring-1 ring-white/10">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.9s" }} />
          <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: "160ms", animationDuration: "0.9s" }} />
          <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: "320ms", animationDuration: "0.9s" }} />
        </span>
        <span className="text-caption text-white/80 uppercase tracking-wider font-bold">Đang tải</span>
      </div>
    </div>
  );
}
