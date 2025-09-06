"use client";
export default function UserShell({ children }: { children: React.ReactNode }) {
  // Do not render any sidebar here. Page-level layouts decide their own structure.
  return <>{children}</>;
}
