import { TopBar } from "@/components/TopBar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
