"use client";

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface EditButtonProps {
  onClick: () => void;
  customButton?: React.ReactNode;
}

export function EditButton({ onClick, customButton }: EditButtonProps) {
  return (
    <Button variant="ghost" onClick={onClick}>
      {customButton ?? <Edit className="h-4 w-4" />}
    </Button>
  );
}
