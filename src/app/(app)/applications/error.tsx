"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function ApplicationsError(props: ErrorPageProps) {
  return <ScreenError {...props} title="Your applications didn't load" />;
}
