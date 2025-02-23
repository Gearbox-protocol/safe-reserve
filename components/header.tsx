"use client";

import { ConnectKitButton } from "connectkit";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-background px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-foreground flex items-center gap-2">
          <Image
            src="https://static.gearbox.fi/logo/logo_monochrome_white@2x.png"
            alt="Gearbox Protocol"
            width={120}
            height={24}
            priority
          />
          <span className="font-bold italic">Reserve Safe</span>
        </div>

        <div className="flex items-center gap-4">
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
}
