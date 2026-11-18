import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className={`brand${compact ? " brand-compact" : ""}`}
      href="/"
      aria-label="Rose Professional Cleaning home"
    >
      <Image
        className="brand-image"
        src={brand.logo}
        alt="Rose Professional Cleaning — official logo"
        width={brand.logoWidth}
        height={brand.logoHeight}
        sizes="(max-width: 640px) 76px, 100px"
      />
      {!compact && (
        <span className="brand-word" aria-hidden="true">
          Rose<small>Professional Cleaning</small>
        </span>
      )}
    </Link>
  );
}
