import { cn } from "@/utils/tw-utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  href: string;
  text?: string;
  onClick?: () => void;

  className?: string;
}

export function BackButton({
  href,
  text,
  onClick,
  className,
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center text-sm text-muted-foreground hover:text-foreground mb-6",
        className
      )}
      onClick={onClick}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {text || "Back"}
    </Link>
  );
}
