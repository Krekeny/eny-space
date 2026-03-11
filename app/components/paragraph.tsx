import { cn } from "@/actions/lib/utils";

interface ParagraphProps {
  children: React.ReactNode;
  className?: string;
}

export function Paragraph({ children, className }: ParagraphProps) {
  return <p className={cn(className)}>{children}</p>;
}
