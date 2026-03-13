import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { signOut } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";

interface MobileMenuProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ user, open, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-14 z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-white/10 bg-neutral-950 px-4 pb-4 pt-3 md:hidden">
      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm font-medium text-white/90"
          onClick={onClose}
        >
          Home
        </Link>
        {user && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white/90"
            onClick={onClose}
          >
            Dashboard
          </Link>
        )}
        <Link
          href="/#about"
          className="text-sm font-medium text-white/90"
          onClick={onClose}
        >
          About
        </Link>
      </nav>

      <div className="mt-3 flex flex-col gap-2">
        {user ? (
          <form action={signOut}>
            <Button
              type="submit"
              size="default"
              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-white/90"
            >
              <span>Sign out</span>
              <ArrowUpRightIcon className="ml-1 size-3.5" aria-hidden />
            </Button>
          </form>
        ) : (
          <>
            <Button
              variant="outline"
              size="default"
              className="inline-flex h-9 w-full items-center justify-center rounded-full border-white/20 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white/90 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/login" onClick={onClose}>
                Login
              </Link>
            </Button>
            <Button
              size="default"
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-white/90"
              asChild
            >
              <Link href="/signup" onClick={onClose}>
                Get started
                <ArrowUpRightIcon className="ml-1 size-3.5" aria-hidden />
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

