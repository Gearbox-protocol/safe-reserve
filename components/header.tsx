"use client";

import { Header } from "@gearbox-protocol/permissionless-ui";
import { ConnectKitButton } from "connectkit";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

export default function HeaderLayout() {
  const pathname = usePathname();
  const { chain, isConnected } = useAccount();

  return (
    <Header
      appName="Safe"
      navigation={[
        {
          href: "/",
          text: "Multisig",
          isActive: !pathname.startsWith("/emergency"),
        },
        {
          href: "/emergency",
          text: "Emergency",
          isActive: pathname.startsWith("/emergency"),
        },
      ]}
      connectKitButton={
        <>
          {isConnected && chain && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">{chain.name}</span>
            </div>
          )}

          <ConnectKitButton />
        </>
      }
    />
  );
}
