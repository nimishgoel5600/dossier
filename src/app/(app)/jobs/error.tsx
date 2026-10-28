"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function JobsError(props: ErrorPageProps) {
  return <ScreenError {...props} title="Find jobs didn't load" />;
}
