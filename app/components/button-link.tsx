import Link from "next/link";
import { cn } from "@/actions/lib/utils";

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  endIcon?: React.ReactNode;
}

export function ButtonLink({
  href,
  children,
  className,
  endIcon,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
        className
      )}
    >
      {children}
      {endIcon}
    </Link>
  );
}
