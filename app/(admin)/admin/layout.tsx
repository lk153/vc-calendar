import { AdminSidebar } from "@/components/AdminSidebar";
import { TopBar } from "@/components/TopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar title="Admin Console" admin />
        <main className="flex-1 p-md md:p-lg max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
