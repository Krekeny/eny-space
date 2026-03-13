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
    <div className="fixed right-0 top-14 z-40 max-h-[calc(100vh-3.5rem)] w-1/3 overflow-y-auto border-t border-white/10 bg-neutral-950 px-4 pb-4 pt-3 md:hidden">
      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className={mobileLinkClass}
          onClick={onClose}
        >
          Home
        </Link>
        {user && (
          <Link
            href="/dashboard"
            className={mobileLinkClass}
            onClick={onClose}
          >
            Dashboard
          </Link>
        )}
        <Link
          href="/#about"
          className={mobileLinkClass}
          onClick={onClose}
        >
          About
        </Link>
      </nav>

      <div className="mt-3 flex flex-col gap-2">
        {user ? (
          <form action={signOut}>
            <button type="submit" className={mobileLinkClass}>
              Sign out
            </button>
          </form>
        ) : (
          <>
            <Link
              href="/login"
              onClick={onClose}
              className={mobileLinkClass}
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className={mobileLinkClass}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

