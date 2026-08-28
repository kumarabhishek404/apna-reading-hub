import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const LOGO_SRC = "/icons/apna-notes-logo.png";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  href?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { img: 36, className: "h-9 w-9" },
  md: { img: 48, className: "h-11 w-11" },
  lg: { img: 72, className: "h-[72px] w-[72px]" },
  xl: { img: 112, className: "h-24 w-24" },
};

function LogoImage({
  size,
  className,
}: {
  className?: string;
  size: keyof typeof sizes;
}) {
  const dim = sizes[size];
  return (
    <Image
      src={LOGO_SRC}
      alt="Apna Notes"
      width={dim.img}
      height={dim.img}
      className={cn("shrink-0 rounded-full bg-white object-contain p-0.5", dim.className, className)}
      priority
    />
  );
}

export function Logo({
  className,
  showWordmark = true,
  href = "/",
  onClick,
  size = "md",
}: LogoProps) {
  const content = (
    <>
      <LogoImage size={size} />
      {showWordmark && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand">Apna Notes</p>
          <p className="truncate text-xs text-muted">Your Personal Notebook</p>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn("flex items-center gap-3", className)}
        aria-label="Apna Notes home"
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-3", className)}>{content}</div>;
}

export function LogoMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: keyof typeof sizes;
}) {
  return <LogoImage size={size} className={className} />;
}
