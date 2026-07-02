import { AdminTopNav } from "@/components/app/admin-top-nav";

interface AdminShellProps {
  children: React.ReactNode;
}

/**
 * Visual chrome for the admin panel. Authorization and step-up unlock are
 * enforced server-side in `app/app/admin/layout.tsx`, so this component renders
 * only once the user is a verified, unlocked admin.
 */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[var(--app-bg-shell)] text-white">
      <AdminTopNav />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
