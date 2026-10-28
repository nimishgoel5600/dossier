"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function SettingsError(props: ErrorPageProps) {
  return <ScreenError {...props} title="Settings didn't load" />;
}
