"use client";

import {
  DataThemeProvider,
  IconProvider,
  ThemeProvider,
  ToastProvider,
} from "@once-ui-system/core";
import { LayoutProvider } from "@once-ui-system/core/next";
import { LikesProvider } from "@/components/Likes";
import { icons } from "@/resources/icons";
import { dataStyle, style } from "@/resources/once-ui.config";

// LayoutProvider from /next, not the package root: only the /next one routes
// links and images through next/link and next/image.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <ThemeProvider {...style}>
        <DataThemeProvider {...dataStyle}>
          <ToastProvider>
            <IconProvider icons={icons}>
              <LikesProvider>{children}</LikesProvider>
            </IconProvider>
          </ToastProvider>
        </DataThemeProvider>
      </ThemeProvider>
    </LayoutProvider>
  );
}
