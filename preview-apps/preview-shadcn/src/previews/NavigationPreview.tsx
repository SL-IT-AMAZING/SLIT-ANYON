import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NavigationPreview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Navigation</h2>
        <p className="text-muted-foreground mt-1">
          Tab components for switching between content panels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Settings</CardTitle>
          <CardDescription>
            Switch between tabs to see different settings panels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account</CardTitle>
                  <CardDescription>
                    Update your account information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tab-name">Name</Label>
                    <Input id="tab-name" defaultValue="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tab-email">Email</Label>
                    <Input
                      id="tab-email"
                      defaultValue="john@example.com"
                      type="email"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Password</CardTitle>
                  <CardDescription>Change your password here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tab-current">Current password</Label>
                    <Input id="tab-current" type="password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tab-new">New password</Label>
                    <Input id="tab-new" type="password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tab-confirm">Confirm password</Label>
                    <Input id="tab-confirm" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Update password</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notifications</CardTitle>
                  <CardDescription>
                    Manage your notification preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      label: "Email Notifications",
                      desc: "Receive emails for important updates",
                    },
                    {
                      label: "Push Notifications",
                      desc: "Receive push notifications on your device",
                    },
                    {
                      label: "Marketing Emails",
                      desc: "Receive emails about new features and offers",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      <Badge variant="outline">On</Badge>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button>Save preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Tabs</CardTitle>
          <CardDescription>
            Tabs for organizing different types of content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Revenue",
                    value: "$45,231.89",
                    change: "+20.1%",
                  },
                  { label: "Subscriptions", value: "2,350", change: "+180" },
                  { label: "Active Users", value: "12,234", change: "+19%" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-600 font-medium">
                        {stat.change}
                      </span>{" "}
                      from last month
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="analytics" className="pt-4">
              <div className="rounded-lg border p-8 text-center">
                <p className="text-lg font-medium">Analytics Dashboard</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Charts and metrics would appear here.
                </p>
                <Separator className="my-4" />
                <div className="flex justify-center gap-4">
                  <Badge>Page Views: 45.2K</Badge>
                  <Badge variant="secondary">Sessions: 12.4K</Badge>
                  <Badge variant="outline">Bounce Rate: 32%</Badge>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reports" className="pt-4">
              <div className="space-y-3">
                {[
                  "Q4 2024 Summary",
                  "Annual Revenue Report",
                  "User Growth Analysis",
                  "Marketing ROI",
                ].map((report) => (
                  <div
                    key={report}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{report}</span>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="settings" className="pt-4">
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Display Settings</p>
                <div className="space-y-1.5">
                  <Label htmlFor="tab-timezone">Timezone</Label>
                  <Input
                    id="tab-timezone"
                    defaultValue="UTC-8 (Pacific Time)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tab-language">Language</Label>
                  <Input id="tab-language" defaultValue="English (US)" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
