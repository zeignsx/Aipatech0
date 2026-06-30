import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AIPATECH Energy Limited — Oil & Gas Engineering, Nigeria" },
      { 
        name: "description", 
        content: "Indigenous Nigerian oil & gas engineering, manufacturing, integrity management and equipment supply. Excellence, innovation and safety since 2019." 
      },
      { name: "author", content: "AIPATECH Energy Limited" },
      { name: "theme-color", content: "#1e3a5f" },
      { name: "msapplication-TileColor", content: "#1e3a5f" },
      
      // Open Graph
      { property: "og:title", content: "AIPATECH Energy Limited — Oil & Gas Engineering, Nigeria" },
      { 
        property: "og:description", 
        content: "Indigenous Nigerian oil & gas engineering, manufacturing, integrity management and equipment supply. Excellence, innovation and safety since 2019." 
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aipatechenergy.com" },
      { property: "og:site_name", content: "AIPATECH Energy Limited" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/093543fe-6c2c-48cc-8f01-8d3bd12cb14a/id-preview-e4f30199--8b3983f3-76f7-4ea7-8c8e-f3178021325c.lovable.app-1778155255156.png" },
      
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AIPATECH Energy Limited — Oil & Gas Engineering, Nigeria" },
      { 
        name: "twitter:description", 
        content: "Indigenous Nigerian oil & gas engineering, manufacturing, integrity management and equipment supply. Excellence, innovation and safety since 2019." 
      },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/093543fe-6c2c-48cc-8f01-8d3bd12cb14a/id-preview-e4f30199--8b3983f3-76f7-4ea7-8c8e-f3178021325c.lovable.app-1778155255156.png" },
    ],
    links: [
      // ===== STYLESHEETS =====
      { rel: "stylesheet", href: appCss },
      
      // ===== FAVICON - Modern Browsers (SVG) =====
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      
      // ===== FAVICON - Fallback (ICO) =====
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      
      // ===== FAVICON - Apple Touch Icon =====
      { rel: "apple-touch-icon", href: "/favicon-180.png" },
      
      // ===== FAVICON - Android/Chrome =====
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
      
      // ===== FAVICON - Older Browsers =====
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      
      // ===== WEB MANIFEST =====
      { rel: "manifest", href: "/site.webmanifest" },
      
      // ===== FONTS =====
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { 
        rel: "stylesheet", 
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" 
      },
    ],
  }),
  shellComponent: function RootShell({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head suppressHydrationWarning>
          <HeadContent />
        </head>
        <body suppressHydrationWarning>
          {children}
          <Scripts />
        </body>
      </html>
    );
  },
  component: function RootComponent() {
    const { queryClient } = Route.useRouteContext();

    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
              <Outlet />
            </main>
            <SiteFooter />
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    );
  },
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});