"use client";
import CancelNotifPoller from "@/components/CancelNotifPoller";
import { CancelNotifProvider } from "@/context/CancelNotifContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CancelNotifProvider>
      <CancelNotifPoller />
      {children}
    </CancelNotifProvider>
  );
}