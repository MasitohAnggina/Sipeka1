"use client";

import CancelNotifPoller from "@/components/CancelNotifPoller";

export default function DokterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CancelNotifPoller />
      {children}
    </>
  );
}