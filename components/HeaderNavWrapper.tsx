"use client";

import { usePathname } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";

export default function HeaderNavWrapper() {
  const pathname = usePathname() ?? "";
  const hidePaths = ["/login"];
  if (hidePaths.includes(pathname)) return null;
  return <HeaderNav />;
}
