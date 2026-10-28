"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function ApplicationError(props: ErrorPageProps) {
  return <ScreenError {...props} title="This application didn't load" elsewhere={{ href: "/applications", label: "Back to Applications" }} />;
}
