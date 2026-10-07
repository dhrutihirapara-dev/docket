import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/sonner";
import { PRODUCT_DESCRIPTION } from "@/config/platform";
import {
  getPlatformSettings,
  resolveBrandName,
  resolveFaviconUrl,
} from "@/lib/settings";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// The brand name is admin-configurable at runtime (platform_settings), so the
// title template can't be a static build-time constant — it must be read per
// request, same reasoning as every other DB-driven page in this app (a
// Docker build has no database, and a baked answer would go stale anyway).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const name = resolveBrandName(settings.brandName);
  const faviconUrl = resolveFaviconUrl(settings.faviconKey, settings.logoKey);
  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: PRODUCT_DESCRIPTION,
    // Falls back to public/favicon.ico (Next.js's implicit default) when
    // neither a favicon nor a logo is configured.
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Only the agent/admin portals have dark mode (the customer portal is
  // always light — see CLAUDE.md), but the pre-paint theme script must live
  // in the root <head> to run before the body paints. Fetching settings here
  // (unused by the customer portal) is the tradeoff for that placement.
  const settings = await getPlatformSettings();

  return (
    <html
      className={cn("font-sans", inter.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript
          appearanceMode={settings.appearanceMode}
          theme={settings.theme}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
