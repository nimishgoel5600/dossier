"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function ResumeError(props: ErrorPageProps) {
  return <ScreenError {...props} title="Your base resume didn't load" />;
}
