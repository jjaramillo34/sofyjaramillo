import { notFound } from "next/navigation";

// Any unknown path under /en or /es renders the localized [lang]/not-found.tsx.
export default function CatchAll() {
  notFound();
}
