import { ScreenSkeleton } from "@/components/screen-skeleton";

export default function JobsLoading() {
  return <ScreenSkeleton label="Looking for postings…" variant="list" />;
}
