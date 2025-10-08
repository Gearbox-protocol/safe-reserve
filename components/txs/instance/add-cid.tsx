"use client";

import { Button, Card, Input } from "@gearbox-protocol/permissionless-ui";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function AddCid({
  cids,
  msg,
  index,
  onSelect,
}: {
  msg?: string;
  cids: string[];
  index: number;
  onSelect: (cids: string[]) => Promise<void>;
}) {
  const [cid, setCid] = useState("");
  const updatedCids = useMemo(
    () => [...cids.slice(0, index), cid, ...cids.slice(index + 1)],
    [cid, cids, index]
  );
  return (
    <div className="px-1">
      <Card className="w-full p-6 space-y-4">
        <div className="space-y-0">
          {msg && <div>{msg}</div>}
          <div>
            {`${index === cids.length ? "Add IPFS CID" : `Replace or Remove IPFS CID #${index}`} with transactions`}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="w-full">
            <Input
              placeholder="Enter your ipfs cid..."
              value={cid}
              onChange={(e) => {
                setCid(e.target.value);
              }}
            />
          </div>
          <Link
            key={`add-cid-${index}`}
            href={`/txs?cids=${updatedCids.join(",")}`}
            onClick={(e) => {
              if (!cid) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <Button
              onClick={async () => {
                await onSelect(updatedCids);
              }}
              disabled={!cid}
            >
              {`${index === cids.length ? "Add" : "Replace"} transactions`}
            </Button>
          </Link>

          {index < cids.length && (
            <Link
              key={`remove-cid-${index}`}
              href={`/txs?cids=${[...cids.slice(0, index), ...cids.slice(index + 1)].join(",")}`}
              onClick={(e) => {
                if (!cid) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <Button
                variant="outline"
                className="w-[36px] text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                onClick={async () => {
                  await onSelect([
                    ...cids.slice(0, index),
                    ...cids.slice(index + 1),
                  ]);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
