"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export type TabType = "queue" | "execute" | "history";

function useTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>();

  useEffect(() => {
    if (activeTab === undefined) {
      const tab = searchParams.get("tab") as TabType;
      setActiveTab(
        tab && ["queue", "execute", "history"].includes(tab) ? tab : "queue"
      );
    }
  }, [searchParams, activeTab]);

  return {
    activeTab,
    handleTabChange: (value: TabType) => {
      setActiveTab(value);
      router.replace(`?tab=${value}`);
    },
  };
}

export default useTabs;
