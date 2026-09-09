import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  Settings,
  Sparkles,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";

import { adminApi } from "@/lib/admin-api";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/services", label: "Services", icon: Sparkles },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/ads", label: "Ads", icon: Megaphone },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: adminApi.me,
    retry: false,
  });

  useEffect(() => {
    if (isError) navigate({ to: "/admin/login", replace: true });
  }, [isError, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await adminApi.logout().catch(() => undefined);
    queryClient.clear();
    navigate({ to: "/admin/login", replace: true });
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-on-dark transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <div className="font-display text-xl leading-tight">Mayor Beauty</div>
            <div className="text-[10px] tracking-[0.3em] text-on-dark/60 uppercase">
              Place Admin
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-blue text-on-brand"
                    : "text-on-dark/70 hover:bg-on-dark/10 hover:text-on-dark"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-on-dark/10 p-3">
          <div className="px-4 pb-3 text-xs text-on-dark/60">{data.user.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-on-dark/70 transition-colors hover:bg-brand-red hover:text-on-brand"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/90 px-5 py-4 backdrop-blur md:px-8">
          <button
            type="button"
            aria-label="Open menu"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl leading-tight md:text-3xl">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </header>
        <main className="px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
