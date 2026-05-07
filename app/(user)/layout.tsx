import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
