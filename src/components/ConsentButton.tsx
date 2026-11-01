"use client";

import type { ReactNode } from "react";
import { openConsent } from "./consent";

// Brings the cookie notice back so the visitor can change their choice.
export default function ConsentButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={openConsent} className={className}>
      {children}
    </button>
  );
}
