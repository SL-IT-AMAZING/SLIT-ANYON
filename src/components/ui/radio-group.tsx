"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { CircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  onValueChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseRadioGroup> & {
  onValueChange?: (value: string) => void;
}) {
  return (
    <BaseRadioGroup
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      onValueChange={(value) => onValueChange?.(value as string)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Radio.Root>) {
  return (
    <Radio.Root
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      <Radio.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <CircleIcon className="size-2 fill-current" />
      </Radio.Indicator>
    </Radio.Root>
  );
}

export { RadioGroup, RadioGroupItem };
