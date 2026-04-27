// Auth pages get their full-screen dark layout from AppShell in the root layout.
// This file just passes children through so Next.js treats (auth) as a route group.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
