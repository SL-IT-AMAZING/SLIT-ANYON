import { useState } from "react";

export function ButtonPreview() {
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Buttons</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Button Sizes</h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-xs">Extra Small</button>
            <button className="btn btn-sm">Small</button>
            <button className="btn btn-md">Medium</button>
            <button className="btn btn-lg">Large</button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Button Variants</h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn">Default</button>
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-accent">Accent</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-link">Link</button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Button States</h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-active">Active</button>
            <button className="btn btn-disabled" disabled>
              Disabled
            </button>
            <button
              className="btn btn-loading"
              onClick={() => setClickedButton("loading")}
            >
              {clickedButton === "loading" ? "Loading..." : "Click Me"}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Button Groups</h3>
          <div className="flex gap-2">
            <div className="btn-group">
              <button className="btn">Left</button>
              <button className="btn">Middle</button>
              <button className="btn">Right</button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Wide & Full Width</h3>
          <div className="flex flex-col gap-2 w-full">
            <button className="btn btn-wide">Wide Button</button>
            <button className="btn btn-block">Full Width Button</button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Color Variants</h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-error">Error</button>
            <button className="btn btn-warning">Warning</button>
            <button className="btn btn-success">Success</button>
            <button className="btn btn-info">Info</button>
          </div>
        </div>
      </div>
    </div>
  );
}
