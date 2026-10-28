"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function ProfileError(props: ErrorPageProps) {
  return <ScreenError {...props} title="Your profile didn't load" />;
}
