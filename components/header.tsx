"use client";

import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import { useAccount } from "wagmi";

export default function Header() {
  const { chain, isConnected } = useAccount();

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
          <span className="font-bold italic">Permissionless Safe</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Network Display */}
          {isConnected && chain && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">
                {chain.name}
              </span>
            </div>
          )}
          
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
}
