import { ExternalLink } from "lucide-react";
import { Address } from "viem";
import { Button } from "./button";
import { TabButton } from "./tab-button";
import { Table, TableCell } from "./table";
import { TokenIcon } from "./token-icon";
import { UpdatedValue } from "./updated-value";

interface TableCellAssetProps {
  assetAddress: Address;
  symbol: string;
  comment?: string;
  explorerUrl?: string;
}

export function TableCellAsset({
  assetAddress,
  symbol,
  comment,
  explorerUrl,
}: TableCellAssetProps) {
  return (
    <TableCell>
      <div className="flex items-center gap-3">
        <TokenIcon symbol={symbol} size={24} />
        <div className="flex items-center gap-1">
          <div className="font-medium">{symbol}</div>
          {comment && (
            <div className="text-md text-muted-foreground">({comment})</div>
          )}
          {explorerUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white p-0 h-auto"
              onClick={() =>
                window.open(`${explorerUrl}/address/${assetAddress}`, "_blank")
              }
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </TableCell>
  );
}

export interface TableCellUpdatableProps {
  oldValue?: string;
  newValue: string;
  onEdit?: () => void;
  isEditable?: boolean;
  className?: string;
  customButton?: React.ReactNode;
  align?: "left" | "right" | "center";
  postfix?: string;
  disabled?: boolean;
  nowrap?: boolean;
}

export function TableCellUpdatable({
  oldValue,
  newValue,
  onEdit,
  isEditable = true,
  className,
  align = "right",
  customButton,
  postfix,
  disabled,
  nowrap,
}: TableCellUpdatableProps) {
  const alignmentClass = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
  }[align];

  return (
    <TableCell className={className}>
      <div className={`flex ${alignmentClass} w-full text-${align}`}>
        <UpdatedValue
          oldValue={oldValue}
          newValue={newValue}
          onEdit={onEdit}
          isEditable={isEditable}
          customButton={customButton}
          postfix={postfix}
          disabled={disabled}
          nowrap={nowrap}
        />
      </div>
    </TableCell>
  );
}

interface TableEditableProps {
  title: string;
  onNew?: () => void;
  newButtonText?: string;
  isLoading?: boolean;
  buttonLoadingText?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function TableEditable({
  title,
  onNew,
  newButtonText = "New",
  buttonLoadingText = "Adding...",
  isLoading,
  children,
  disabled = false,
}: TableEditableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onNew && (
          <TabButton onClick={onNew} disabled={isLoading || disabled}>
            {isLoading ? buttonLoadingText : newButtonText}
          </TabButton>
        )}
      </div>
      <div className="rounded-lg border">
        <Table>{children}</Table>
      </div>
    </div>
  );
}
