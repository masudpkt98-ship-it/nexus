import { Badge } from "@/components/ui";

/** Small indicator showing whether a screen is showing live API data or the demo fallback. */
export function LiveBadge({ live }: { live: boolean }) {
  return live ? (
    <Badge tone="green">
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live · Laravel API
    </Badge>
  ) : (
    <Badge tone="amber">Demo data</Badge>
  );
}
