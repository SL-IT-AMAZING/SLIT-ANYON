import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const categories = [
  {
    title: "Buttons",
    description: "Click actions and form submissions",
    preview: (
      <div className="flex gap-2">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="sm" variant="outline">
          Outline
        </Button>
      </div>
    ),
  },
  {
    title: "Inputs",
    description: "Text fields, selects, and form controls",
    preview: (
      <Input placeholder="Type something..." className="max-w-[200px]" />
    ),
  },
  {
    title: "Cards",
    description: "Container components for grouped content",
    preview: (
      <div className="rounded-lg border bg-card p-3 text-sm shadow-sm">
        <p className="font-medium">Card Preview</p>
        <p className="text-muted-foreground text-xs">Composable containers</p>
      </div>
    ),
  },
  {
    title: "Dialogs",
    description: "Modal windows and overlay content",
    preview: (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          Open Dialog
        </Button>
        <span className="text-xs text-muted-foreground">Click to preview</span>
      </div>
    ),
  },
  {
    title: "Tables",
    description: "Structured data display with rows and columns",
    preview: (
      <div className="rounded border text-xs">
        <div className="grid grid-cols-3 gap-2 border-b bg-muted/50 p-2 font-medium">
          <span>Name</span>
          <span>Status</span>
          <span>Role</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2">
          <span>Alice</span>
          <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">
            Active
          </Badge>
          <span>Admin</span>
        </div>
      </div>
    ),
  },
  {
    title: "Navigation",
    description: "Tabs, menus, and page navigation",
    preview: (
      <div className="inline-flex h-8 items-center rounded-md bg-muted p-1 text-xs">
        <span className="rounded-sm bg-background px-2 py-1 font-medium shadow-sm">
          Tab 1
        </span>
        <span className="px-2 py-1 text-muted-foreground">Tab 2</span>
        <span className="px-2 py-1 text-muted-foreground">Tab 3</span>
      </div>
    ),
  },
  {
    title: "Feedback",
    description: "Alerts, badges, and status indicators",
    preview: (
      <div className="flex gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Info</Badge>
        <Badge variant="destructive">Error</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    ),
  },
  {
    title: "Layout",
    description: "Separators, scroll areas, and spacing",
    preview: (
      <div className="space-y-2">
        <div className="text-xs">Section A</div>
        <Separator />
        <div className="text-xs">Section B</div>
      </div>
    ),
  },
];

export function OverviewPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          shadcn/ui Components
        </h2>
        <p className="text-muted-foreground mt-1">
          A collection of beautifully crafted, accessible components built on
          Radix UI and Tailwind CSS.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Card key={cat.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{cat.title}</CardTitle>
              <CardDescription className="text-xs">
                {cat.description}
              </CardDescription>
            </CardHeader>
            <CardContent>{cat.preview}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
