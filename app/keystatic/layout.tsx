import type { Metadata } from "next";
import KeystaticApp from "./keystatic";

export const metadata: Metadata = {
  title: "Studio · Sofy Jaramillo",
  robots: { index: false, follow: false },
};

// The CMS admin is its own root layout so it doesn't inherit the site's theme.
export default function KeystaticLayout() {
  return (
    <html lang="en">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
