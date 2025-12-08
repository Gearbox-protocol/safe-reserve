"use client";

import {
  AppLogo,
  Header,
  Navbar,
  NavItem,
  useMobileMenu
} from "@gearbox-protocol/permissionless-ui";
import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";

function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const activePath = pathname?.startsWith("/emergency") ? "/emergency" : "/";

  return (
    <Navbar>
      <NavItem
        variant="tab"
        active={activePath === "/"}
        onClick={() => router.push("/")}
        style={{ cursor: "pointer" }}
      >
        Multisig
      </NavItem>
      <NavItem
        variant="tab"
        active={activePath === "/emergency"}
        onClick={() => router.push("/emergency")}
        style={{ cursor: "pointer" }}
      >
        Emergency
      </NavItem>
    </Navbar>
  );
}

function NavigationMobile() {
  const pathname = usePathname();
  const router = useRouter();
  const { closeMobileMenu } = useMobileMenu();

  const activePath = pathname?.startsWith("/emergency") ? "/emergency" : "/";

  const handleNavigate = (path: string) => {
    router.push(path);
    closeMobileMenu();
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <NavItem
        variant="default"
        active={activePath === "/"}
        onClick={() => handleNavigate("/")}
        className="w-full justify-start cursor-pointer"
      >
        Multisig
      </NavItem>
      <NavItem
        variant="default"
        active={activePath === "/emergency"}
        onClick={() => handleNavigate("/emergency")}
        className="w-full justify-start cursor-pointer"
      >
        Emergency
      </NavItem>
    </div>
  );
}

export default function HeaderLayout() {
  const { chain, isConnected } = useAccount();

  return (
    <Header
      logo={
        <Link href="/" className="no-underline hover:opacity-80 transition-opacity">
          <AppLogo appName="Safe" />
        </Link>
      }
      navigation={<Navigation />}
      mobileMenuContent={<NavigationMobile />}
      actions={
        <>
          {chain && isConnected ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">{chain.name}</span>
            </div>
          ) : (
            <div className="w-24 h-8" />
          )}
          <ConnectKitButton />
        </>
      }
    />
  );
}
