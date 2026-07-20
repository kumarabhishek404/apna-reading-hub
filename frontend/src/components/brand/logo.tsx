import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/icons/apna-sathi-logo.png";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  href?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { img: 36, className: "h-9 w-9" },
  md: { img: 44, className: "h-11 w-11" },
  lg: { img: 56, className: "h-14 w-14" },
};

export function Logo({
  className,
  showWordmark = true,
  href = "/",
  onClick,
  size = "md",
}: LogoProps) {
  const dim = sizes[size];

  const mark = (
    <Image
      src={LOGO_SRC}
      alt="Apna Sathi"
      width={dim.img}
      height={dim.img}
      className={cn("shrink-0 rounded-xl object-contain", dim.className)}
      priority
    />
  );

  const content = (
    <>
      {mark}
      {showWordmark && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand">Apna Sathi</p>
          <p className="truncate text-xs text-muted">
            A small initiative by Apna Rojgar
          </p>
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
        aria-label="Apna Sathi home"
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-3", className)}>{content}</div>;
}

export function LogoMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dim = sizes[size];
  return (
    <Image
      src={LOGO_SRC}
      alt="Apna Sathi"
      width={dim.img}
      height={dim.img}
      className={cn("shrink-0 rounded-xl object-contain", dim.className, className)}
      priority
    />
  );
}
