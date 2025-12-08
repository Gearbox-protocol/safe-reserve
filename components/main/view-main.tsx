"use client";

import {
  Button,
  Card,
  CardContent,
  Input,
} from "@gearbox-protocol/permissionless-ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ViewMain() {
  const [cid, setCid] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card className="w-full max-w-[600px] p-4 space-y-4">
        <h1 className="text-center text-lg md:text-2xl font-bold text-white">
          Enter IPFS CID with transactions
        </h1>

        <CardContent className="space-y-4">
          <Input
            placeholder="Enter your ipfs cid..."
            value={cid}
            onChange={(e) => {
              setCid(e.target.value);
            }}
          />
        </CardContent>
        <div className="flex w-full justify-center">
          <Button
            onClick={() => {
              router.push(`/txs?cid=${cid}`);
            }}
            disabled={!cid}
          >
            Open transactions
          </Button>
        </div>
      </Card>
    </div>
  );
}
