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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, MapPin, Star, Users } from "lucide-react";

export function CardPreview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cards</h2>
        <p className="text-muted-foreground mt-1">
          Versatile container components for grouping related content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" placeholder="My awesome project" />
            </div>
            <div className="space-y-1.5">
              <Label>Framework</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="remix">Remix</SelectItem>
                  <SelectItem value="astro">Astro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Team Members</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Manage your team members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                name: "Sofia Davis",
                email: "sofia@example.com",
                role: "Owner",
              },
              {
                name: "Jackson Lee",
                email: "jackson@example.com",
                role: "Member",
              },
              {
                name: "Olivia Martin",
                email: "olivia@example.com",
                role: "Member",
              },
            ].map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <Badge
                  variant={member.role === "Owner" ? "default" : "secondary"}
                >
                  {member.role}
                </Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              Invite Member
            </Button>
          </CardFooter>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
          <CardHeader className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <Badge>Popular</Badge>
            </div>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>
              Everything you need for a growing business.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Separator />
            <ul className="space-y-2 text-sm">
              {[
                "Unlimited projects",
                "Priority support",
                "Advanced analytics",
                "Custom domains",
                "Team collaboration",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="relative">
            <Button className="w-full">Get Started</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Office Location</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Acme Inc.</p>
              <p className="text-muted-foreground">123 Innovation Drive</p>
              <p className="text-muted-foreground">San Francisco, CA 94105</p>
              <p className="text-muted-foreground">United States</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="px-0">
              View on map
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </div>
            <CardDescription>Your default payment method.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-14 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold">
                VISA
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Update
            </Button>
            <Button variant="ghost" className="flex-1 text-destructive">
              Remove
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>
              Configure your notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Push Notifications",
                desc: "Receive push notifications",
                enabled: true,
              },
              {
                label: "Email Digests",
                desc: "Weekly email summary",
                enabled: true,
              },
              {
                label: "SMS Alerts",
                desc: "Critical alerts via SMS",
                enabled: false,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div
                  className={`h-5 w-9 rounded-full transition-colors ${item.enabled ? "bg-primary" : "bg-muted"} relative`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
