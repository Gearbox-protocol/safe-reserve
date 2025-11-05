"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@gearbox-protocol/permissionless-ui";
import { ConnectKitButton } from "connectkit";
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

export default function Header() {
  const { chain, isConnected } = useAccount();
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
          <span className="font-bold italic">Safe</span>
        </div>

        <nav className="hidden md:flex space-x-4">
          <Link
            href="/"
            className={`text-foreground px-2 py-1 rounded transition-colors duration-200 ease-in-out ${
              !pathname.startsWith("/emergency") ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            Multisig
          </Link>
          <Link
            href="/emergency"
            className={`text-foreground px-2 py-1 rounded transition-colors duration-200 ease-in-out ${
              pathname.startsWith("/emergency") ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            Emergency
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Network Display */}
          {isConnected && chain && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">{chain.name}</span>
            </div>
          )}

          <ConnectKitButton />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="h-10 w-10">
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent></DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
