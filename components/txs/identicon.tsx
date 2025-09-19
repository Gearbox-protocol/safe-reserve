export function Identicon({
  address,
  size = 32,
}: {
  address: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-full bg-gray-700 flex items-center justify-center text-white text-xs"
      style={{ width: size, height: size }}
    >
      {address.slice(2, 4)}
    </div>
  );
}
