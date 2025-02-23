"use client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { isAddress } from "viem";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function ViewMain() {
  const [safeAddress, setSafeAddress] = useState("");
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  const validateAddress = (address: string) => {
    if (!address) return;
    const isValid = isAddress(address);
    setHasError(!isValid);
  };

  const handleOpenSafe = () => {
    if (isAddress(safeAddress)) {
      router.push(`/safe/${safeAddress}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(20,20,20)]">
      <Card className="w-full max-w-md bg-[rgb(30,30,30)] border-[rgb(60,60,60)] -mt-20">
        <CardHeader>
          <h1 className="text-center text-2xl font-bold text-white">
            Enter Safe Address
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter your Safe address (0x...)"
            value={safeAddress}
            onChange={(e) => {
              setSafeAddress(e.target.value);
              validateAddress(e.target.value);
            }}
            hasError={hasError}
            errorMessage="Please enter a valid Ethereum address"
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleOpenSafe} disabled={!safeAddress || hasError}>
            Open Safe
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
