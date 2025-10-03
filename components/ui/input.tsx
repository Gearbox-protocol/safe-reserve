import * as React from "react";

import { cn } from "@/utils/tw-utils";

const InputInternal = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-[rgb(40,40,40)] text-white border-[rgb(100,100,100)] focus:bg-[rgb(40,40,40)] active:bg-[rgb(40,40,40)] [&:not(:placeholder-shown)]:bg-[rgb(40,40,40)] autofill:bg-[rgb(40,40,40)] [-webkit-autofill]:bg-[rgb(40,40,40)] [&:-webkit-autofill]:shadow-[0_0_0_1000px_rgb(40,40,40)_inset] [&:-webkit-autofill]:[text-fill-color:rgb(255,255,255)]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
InputInternal.displayName = "Input";

interface InputProps extends React.ComponentProps<"input"> {
  hasError?: boolean;
  errorMessage?: string;
  divClassName?: string;
}

export function Input({
  hasError,
  errorMessage,
  value,
  divClassName,
  ...props
}: InputProps) {
  return (
    <div className={divClassName}>
      <InputInternal
        {...props}
        value={value}
        className={cn(hasError ? "border-red-500" : "", props.className)}
      />
      {hasError && value != "" && (
        <p className="text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
