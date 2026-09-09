import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import adminLoginBg from "@/assets/admin-login-bg.jpg";
import logo from "@/assets/logo.png";

const title = "Admin Login — Mayor Beauty Place";
const description = "Secure admin login for the Mayor Beauty Place admin dashboard.";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await adminApi.login({
        email: email.trim(),
        password: password.trim(),
        remember,
      });
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err) {
      setError((err as Error).message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <img
        src={adminLoginBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-on-dark/20 bg-on-dark/10 px-6 py-10 shadow-lift backdrop-blur-2xl sm:px-10">
          <div className="mb-10 flex flex-col items-center gap-5 text-center">
            <img
              src={logo}
              alt="Mayor Beauty Place logo"
              className="h-16 w-auto rounded-2xl bg-on-dark/90 p-2"
            />
            <div className="space-y-2">
              <div className="text-[11px] font-semibold tracking-[0.3em] text-on-dark/70 uppercase">
                Admin Portal
              </div>
              <h1 className="font-display text-4xl text-on-dark">Welcome back</h1>
              <p className="text-sm text-on-dark/70">
                Sign in to manage treatments, products, and orders.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {notice && (
            <Alert className="mb-5 border-on-dark/30 bg-on-dark/10 text-on-dark">
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium text-on-dark">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mayorbeautyplace.com"
                className="h-12 rounded-full border-on-dark/25 bg-on-dark/10 px-5 text-on-dark placeholder:text-on-dark/50 focus-visible:ring-on-dark/40"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-medium text-on-dark">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 rounded-full border-on-dark/25 bg-on-dark/10 px-5 pr-12 text-on-dark placeholder:text-on-dark/50 focus-visible:ring-on-dark/40"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-on-dark/60 transition-colors hover:text-on-dark"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(Boolean(checked))}
                  className="rounded-full border-on-dark/40 data-[state=checked]:bg-on-dark data-[state=checked]:text-ink"
                />
                <Label htmlFor="remember" className="cursor-pointer font-normal text-on-dark/70">
                  Keep me signed in
                </Label>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "Password resets are handled by your site administrator. Contact them to restore access.",
                  )
                }
                className="text-on-dark transition-colors hover:text-on-dark/70 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-on-dark text-base text-ink hover:bg-on-dark/85"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-on-dark/60">
          <Lock className="h-3 w-3" />
          Authorized administrators only. All access is logged for security.
        </p>
      </div>
    </main>
  );
}
