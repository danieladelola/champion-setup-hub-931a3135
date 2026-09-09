import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { AdSlot } from "@/components/ad-slot";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "../lib/cart";
import { SettingsProvider } from "../lib/site-settings";
import { DEFAULT_SETTINGS } from "../lib/settings";
import { getSiteSettings } from "../lib/settings.functions";
import { WishlistProvider } from "@/lib/wishlist";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => getSiteSettings(),
  head: ({ loaderData }) => {
    const s = loaderData ?? DEFAULT_SETTINGS;
    const title = s.seo.meta_title || s.general.site_name;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: s.seo.meta_description },
        { property: "og:site_name", content: s.general.site_name },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(s.seo.allow_indexing ? [] : [{ name: "robots", content: "noindex, nofollow" }]),
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", type: "image/png", href: s.general.favicon_url || "/favicon.png" },
        {
          rel: "apple-touch-icon",
          href: s.general.favicon_url || "/favicon.png",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: s.general.site_name,
            description: s.seo.meta_description,
            telephone: s.contact.phone,
            email: s.contact.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: "110/112 Rye Lane",
              addressLocality: "London",
              postalCode: "SE15 4RZ",
              addressCountry: "GB",
            },
            openingHours: "Mo-Sa 11:00-18:00",
            sameAs: [s.social.facebook, s.social.instagram, s.social.tiktok].filter(Boolean),
          }),
        },
      ],
    };
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function MaintenanceScreen({ message, siteName }: { message: string; siteName: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-on-dark">
      <div className="max-w-lg text-center">
        <h1 className="font-display text-4xl md:text-5xl">{siteName}</h1>
        <p className="mt-6 text-base leading-relaxed text-on-dark/75">{message}</p>
      </div>
    </main>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const settings = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const maintenance = !isAdmin && settings.system.maintenance_mode;

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider settings={settings}>
        <CartProvider>
          <WishlistProvider>
            {maintenance ? (
              <MaintenanceScreen
                message={settings.system.maintenance_message}
                siteName={settings.general.site_name}
              />
            ) : (
              <>
                {!isAdmin && <SiteHeader />}
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
                {!isAdmin && <AdSlot placement="sitewide_footer" />}
                {!isAdmin && <SiteFooter />}
              </>
            )}
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

