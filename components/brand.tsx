import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { brand } from "@/lib/brand";
export function Brand() {
  return (
    <Link
      className="brand"
      href="/"
      aria-label="Rose Professional Cleaning home"
    >
      {brand.logo ? (
        <Image src={brand.logo} alt="" width={47} height={47} />
      ) : (
        <span className="brand-icon" aria-hidden="true">
          R<Sparkles size={12} />
        </span>
      )}
      <span className="brand-word">
        Rose<small>Professional Cleaning</small>
      </span>
    </Link>
  );
}
