import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Terminal,
  TriangleAlert,
} from "lucide-react";

export function FeedbackPreview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
        <p className="text-muted-foreground mt-1">
          Alerts, badges, separators, and scroll areas for communicating status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alerts</CardTitle>
          <CardDescription>
            Informational banners for user feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the CLI.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again to continue.
            </AlertDescription>
          </Alert>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully.
            </AlertDescription>
          </Alert>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This feature is currently in beta. Some functionality may change.
            </AlertDescription>
          </Alert>
          <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Your storage is almost full. Consider upgrading your plan.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges</CardTitle>
          <CardDescription>Small status indicators and labels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Variants</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-3">Status Badges</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                Pending
              </Badge>
              <Badge variant="destructive">Expired</Badge>
              <Badge variant="secondary">Draft</Badge>
              <Badge variant="outline">Archived</Badge>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-3">Use Cases</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Notification count:</span>
                <Badge>3</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Version tag:</span>
                <Badge variant="outline">v2.1.0</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Feature status:</span>
                <Badge variant="secondary">Beta</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Priority level:</span>
                <Badge variant="destructive">Critical</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Separator</CardTitle>
          <CardDescription>
            Visual dividers between content sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold">Introduction</h4>
              <p className="text-sm text-muted-foreground">
                Separators visually divide content into clear sections.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold">Horizontal</h4>
              <p className="text-sm text-muted-foreground">
                The default orientation creates a horizontal line.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold">Vertical</h4>
              <div className="flex h-5 items-center space-x-4 text-sm">
                <span>Blog</span>
                <Separator orientation="vertical" />
                <span>Docs</span>
                <Separator orientation="vertical" />
                <span>Source</span>
                <Separator orientation="vertical" />
                <span>Support</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scroll Area</CardTitle>
          <CardDescription>
            A scrollable container with custom scrollbar styling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Changelog</h4>
              {[
                {
                  version: "v2.4.0",
                  date: "Dec 2024",
                  desc: "Added new dashboard analytics widgets",
                },
                {
                  version: "v2.3.2",
                  date: "Nov 2024",
                  desc: "Fixed responsive layout issues on mobile",
                },
                {
                  version: "v2.3.1",
                  date: "Nov 2024",
                  desc: "Performance improvements for data tables",
                },
                {
                  version: "v2.3.0",
                  date: "Oct 2024",
                  desc: "Introduced dark mode support",
                },
                {
                  version: "v2.2.1",
                  date: "Sep 2024",
                  desc: "Bug fixes for form validation",
                },
                {
                  version: "v2.2.0",
                  date: "Aug 2024",
                  desc: "Added file upload component",
                },
                {
                  version: "v2.1.0",
                  date: "Jul 2024",
                  desc: "New notification system",
                },
                {
                  version: "v2.0.0",
                  date: "Jun 2024",
                  desc: "Major redesign with new design system",
                },
                {
                  version: "v1.9.5",
                  date: "May 2024",
                  desc: "Security patches and updates",
                },
                {
                  version: "v1.9.0",
                  date: "Apr 2024",
                  desc: "Added multi-language support",
                },
                {
                  version: "v1.8.0",
                  date: "Mar 2024",
                  desc: "Introduced team collaboration features",
                },
                {
                  version: "v1.7.0",
                  date: "Feb 2024",
                  desc: "New API documentation pages",
                },
              ].map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {entry.version}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {entry.date}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.desc}</p>
                  <Separator className="mt-3" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
