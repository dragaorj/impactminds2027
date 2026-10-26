"use client";

// Runs on the initial document load only. On client renders (e.g. a language
// switch re-rendering the root layout) it becomes inert text/plain, which keeps
// React from warning about script tags it would never execute.
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
