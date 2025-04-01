"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export type TabType<T extends readonly string[]> = T[number];

interface UseTabsResult<T extends readonly string[]> {
  activeTab: TabType<T> | undefined;
  handleTabChange: (value: TabType<T>) => void;
}

function useTabs<const T extends readonly [string, ...string[]]>(
  tabs: T,
  defaultTab?: TabType<T>
): UseTabsResult<T> {
  if (!tabs.length) {
    throw new Error("useTabs: tabs array cannot be empty");
  }

  const defaultTabValue = (
    defaultTab && tabs.includes(defaultTab) ? defaultTab : tabs[0]
  ) as TabType<T>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType<T>>();

  useEffect(() => {
    if (activeTab === undefined) {
      const tab = searchParams.get("tab");
      setActiveTab(
        tab && tabs.includes(tab as TabType<T>)
          ? (tab as TabType<T>)
          : defaultTabValue
      );
    }
  }, [searchParams, activeTab, tabs, defaultTabValue]);

  return {
    activeTab,
    handleTabChange: (value: TabType<T>) => {
      setActiveTab(value);
      router.replace(`?tab=${value}`);
    },
  };
}

export default useTabs;
