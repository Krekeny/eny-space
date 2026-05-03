import { cn } from "@/actions/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps {
  as?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

export function Heading({ as: Tag = "h1", children, className }: HeadingProps) {
  return <Tag className={cn("font-heading", className)}>{children}</Tag>;
}
