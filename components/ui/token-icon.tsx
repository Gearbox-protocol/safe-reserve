import Image from "next/image";
import { useState } from "react";

interface TokenIconProps {
  symbol: string;
  size?: number;
}

export function TokenIcon({ symbol, size = 48 }: TokenIconProps) {
  const name = symbol
    .replace("/", "")
    .replace(" ", "")
    .replace("-f", "")
    .replace("-", "_")
    .toLowerCase();

  const defaultSrc = "https://static.gearbox.fi/tokens/default.svg";
  const [src, setSrc] = useState(
    `https://static.gearbox.fi/tokens/${name}.svg`
  );

  return (
    <Image
      src={src}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      // className="rounded-full"
      onError={() => setSrc(defaultSrc)}
    />
  );
}
