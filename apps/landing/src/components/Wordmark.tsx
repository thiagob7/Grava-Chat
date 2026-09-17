import Image from "next/image";

import { BRAND } from "~/lib/brand";

export const Wordmark = ({ className = "" }: { className?: string }) => (
  <span className={`flex select-none items-center gap-2 text-lg font-semibold tracking-tight ${className}`}>
    <Image src="/brand/favicon.svg" alt="" width={28} height={28} className="size-7 rounded-md" />
    {BRAND}
  </span>
);
