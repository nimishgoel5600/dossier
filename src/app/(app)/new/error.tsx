"use client";

import { ScreenError, type ErrorPageProps } from "@/components/screen-error";

export default function NewApplicationError(props: ErrorPageProps) {
  return (
    <ScreenError {...props} title="New application didn't load">
      <p>A posting you pasted is still kept in this tab, so it&apos;ll be there when this works again.</p>
    </ScreenError>
  );
}
