"use client";

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface EditButtonProps {
  onClick?: () => void;
  customButton?: React.ReactNode;
  disabled?: boolean;
}

export function EditButton({
  onClick,
  customButton,
  disabled,
}: EditButtonProps) {
  return (
    <div className={customButton ? "px-4 py-2" : "px-2"}>
      <Button
        className={customButton ? "p-0 h-fit" : "p-2 h-fit"}
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
      >
        {customButton ?? <Edit className="h-4 w-4" />}
      </Button>
    </div>
  );
}
