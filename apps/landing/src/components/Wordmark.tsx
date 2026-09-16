import { BRAND_SHORT } from "~/lib/brand";

export const Wordmark = ({ className = "" }: { className?: string }) => (
  <span className={`select-none text-lg font-bold tracking-tight ${className}`}>
    {BRAND_SHORT}
    <span className="text-brand">Chat</span>
  </span>
);
