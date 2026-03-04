const colorGroups = [
  {
    title: "Base",
    vars: ["background", "foreground"],
  },
  {
    title: "Components",
    vars: [
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "destructive",
      "destructive-foreground",
    ],
  },
  {
    title: "Form",
    vars: ["border", "input", "ring"],
  },
  {
    title: "Charts",
    vars: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
  {
    title: "Sidebar",
    vars: [
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ],
  },
];

function Swatch({ token }: { token: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground">
      <div
        className="mb-2 h-20 rounded-md border"
        style={{ backgroundColor: `var(--${token})` }}
      />
      <p className="text-sm font-medium">--{token}</p>
      <p
        className="mt-1 text-xs text-muted-foreground"
        style={{ color: `var(--${token})` }}
      >
        Sample text in token color
      </p>
    </div>
  );
}

export function ColorPalettePreview() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Color Palette</h1>
        <p className="text-sm text-muted-foreground">
          Live preview of the current CSS variable tokens.
        </p>
      </header>

      {colorGroups.map((group) => (
        <article key={group.title} className="space-y-3">
          <h2 className="text-lg font-medium">{group.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.vars.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
