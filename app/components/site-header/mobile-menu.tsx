import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { signOut } from "@/actions/auth";

interface MobileMenuProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

const mobileLinkClass =
  "block text-left text-base font-medium text-white/90 hover:text-white";

export function MobileMenu({ user, open, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed right-3 top-14 z-40 max-h-[calc(100vh-3.5rem)] w-1/3 overflow-y-auto rounded-xl border border-fuchsia-300/30 bg-slate-900/75 px-4 pb-4 pt-3 shadow-[0_0_30px_rgba(232,121,249,0.2)] backdrop-blur-md md:hidden">
      <nav className="flex flex-col gap-2">
        {/* navigation intentionally hidden; CTA-only header */}
      </nav>

      <div className="mt-3 flex flex-col gap-2">
        {user ? (
          <>
            <Link href="/dashboard" onClick={onClose} className={mobileLinkClass}>
              Dashboard
            </Link>
            <form action={signOut}>
              <button type="submit" className={mobileLinkClass}>
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" onClick={onClose} className={mobileLinkClass}>
              Login
            </Link>
            <Link href="/signup" onClick={onClose} className={mobileLinkClass}>
              Get started
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
