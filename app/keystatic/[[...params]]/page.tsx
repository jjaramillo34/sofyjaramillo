// Keystatic renders its UI from the layout; this page only claims the routes.
// Because the layout never renders it, Next.js can't check it for instant
// navigation, and the admin is a client app with its own routing anyway.
export const instant = false;

export default function KeystaticPage() {
  return null;
}
