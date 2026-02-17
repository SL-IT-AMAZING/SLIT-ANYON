import type { Meta, StoryObj } from "@storybook/react";
import type { LogoSpinnerVariant } from "./LogoSpinner";
import { LogoSpinner } from "./LogoSpinner";

const ALL_VARIANTS: LogoSpinnerVariant[] = [
  "dotChase",
  "strokeDraw",
  "strokeLoop",
  "strokeTrace",
  "strokeFill",
  "pulseWave",
  "combined",
];

const STROKE_VARIANTS: LogoSpinnerVariant[] = [
  "strokeDraw",
  "strokeLoop",
  "strokeTrace",
  "strokeFill",
];

const meta: Meta<typeof LogoSpinner> = {
  title: "chat-v2/LogoSpinner",
  component: LogoSpinner,
  parameters: {
    layout: "centered",
    backgrounds: { default: "light" },
  },
  argTypes: {
    variant: { control: "select", options: ALL_VARIANTS },
    size: { control: { type: "range", min: 24, max: 200, step: 8 } },
  },
};
export default meta;

type Story = StoryObj<typeof LogoSpinner>;

export const DotChase: Story = {
  args: { variant: "dotChase", size: 80 },
};

export const StrokeDraw: Story = {
  args: { variant: "strokeDraw", size: 80 },
};

export const StrokeLoop: Story = {
  args: { variant: "strokeLoop", size: 80 },
};

export const StrokeTrace: Story = {
  args: { variant: "strokeTrace", size: 80 },
};

export const StrokeFill: Story = {
  args: { variant: "strokeFill", size: 80 },
};

export const PulseWave: Story = {
  args: { variant: "pulseWave", size: 80 },
};

export const Combined: Story = {
  args: { variant: "combined", size: 80 },
};

export const StrokeFamily: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 48,
        padding: 32,
      }}
    >
      {STROKE_VARIANTS.map((variant) => (
        <div
          key={variant}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <LogoSpinner variant={variant} size={80} />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: "var(--muted-foreground, #888)",
            }}
          >
            {variant}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 48,
        padding: 32,
      }}
    >
      {ALL_VARIANTS.map((variant) => (
        <div
          key={variant}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <LogoSpinner variant={variant} size={72} />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: "var(--muted-foreground, #888)",
            }}
          >
            {variant}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "end", gap: 32, padding: 32 }}>
      {[24, 48, 80, 120].map((size) => (
        <div
          key={size}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <LogoSpinner size={size} />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: "var(--muted-foreground, #888)",
            }}
          >
            {size}px
          </span>
        </div>
      ))}
    </div>
  ),
};

export const DarkBackground: Story = {
  render: () => (
    <div
      style={{
        background: "#0a0a0a",
        padding: 48,
        borderRadius: 12,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 40,
      }}
    >
      {ALL_VARIANTS.map((variant) => (
        <div
          key={variant}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <LogoSpinner
            variant={variant}
            size={64}
            className="text-neutral-200"
          />
          <span
            style={{ fontSize: 11, fontFamily: "monospace", color: "#666" }}
          >
            {variant}
          </span>
        </div>
      ))}
    </div>
  ),
};
