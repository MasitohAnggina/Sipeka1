import { NotifProvider } from "@/context/NotifContext";

export default function OwnerPetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotifProvider>{children}</NotifProvider>;
}