"use client";

import * as React from "react";
import { cn } from "@/utils/tw-utils";
import { Button } from "./button";

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "lg" | "default";
  children: React.ReactNode;
}

const TabButton = React.forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ className, children, size = "sm", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        size={size}
        className={cn(
          "bg-gray-900 text-gray-100 border-gray-700 hover:bg-gray-800 border-gray-300",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
TabButton.displayName = "TabButton";

export { TabButton };
