import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session) redirect(sp.callbackUrl ?? "/calendar");

  async function loginWithCredentials(formData: FormData) {
    "use server";
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/calendar",
    });
  }

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/calendar" });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-md md:p-lg bg-background antialiased">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft-lg border border-outline-variant overflow-hidden flex flex-col">
        <div className="h-40 bg-primary-container relative flex items-center justify-center shrink-0 overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-16 -right-12 w-56 h-56 rounded-full opacity-50"
            style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.7), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full opacity-40"
            style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.9), transparent 70%)" }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-surface/70 backdrop-blur-sm flex items-center justify-center shadow-soft border border-white/60">
            <span
              className="material-symbols-outlined text-primary text-[44px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
            >
              calendar_month
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-surface to-transparent" />
        </div>

        <div className="p-md md:p-lg flex flex-col gap-md">
          <div className="text-center -mt-xs">
            <h1 className="font-manrope text-headline-md text-on-surface mb-xs">Chào mừng trở lại</h1>
            <p className="font-inter text-body-md text-on-surface-variant">Đăng nhập để tiếp tục đặt phòng họp.</p>
          </div>

          {sp.error && (
            <div className="bg-error-container text-on-error-container rounded-lg p-sm text-body-sm flex items-center gap-xs">
              <Icon name="error" className="text-[18px]" />
              Thông tin đăng nhập không đúng.
            </div>
          )}

          <form action={loginWithCredentials} className="flex flex-col gap-sm">
            <div className="flex flex-col gap-xs">
              <label htmlFor="username" className="font-inter text-body-sm font-semibold text-on-surface">
                Tên đăng nhập hoặc email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                  <Icon name="person" className="text-on-surface-variant text-[20px]" />
                </span>
                <input
                  id="username"
                  name="username"
                  required
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full h-12 pl-10 pr-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-body-md text-on-surface outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="password" className="font-inter text-body-sm font-semibold text-on-surface">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                  <Icon name="lock" className="text-on-surface-variant text-[20px]" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-body-md text-on-surface outline-none transition-shadow"
                />
              </div>
            </div>

            <SubmitButton variant="primary" pendingLabel="Đang đăng nhập…" className="mt-xs w-full">
              Đăng nhập
              <Icon name="arrow_forward" className="text-[18px]" />
            </SubmitButton>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="flex-shrink-0 mx-sm text-on-surface-variant text-caption uppercase tracking-wider">
              Hoặc tiếp tục với
            </span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          <form action={loginWithGoogle}>
            <SubmitButton
              variant="ghost"
              pendingLabel="Đang chuyển hướng…"
              className="w-full bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Tiếp tục với Google
            </SubmitButton>
          </form>
        </div>

        <div className="bg-surface-container-low p-sm text-center border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant flex items-center justify-center gap-xs">
            <Icon name="shield_person" className="text-[16px]" />
            Tài khoản do quản trị viên cấp.
          </p>
        </div>
      </div>
    </main>
  );
}
