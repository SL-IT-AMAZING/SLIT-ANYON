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
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { useState } from "react";

export function InputPreview() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [framework, setFramework] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inputs</h2>
        <p className="text-muted-foreground mt-1">
          Form controls for collecting user input.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Text Inputs</CardTitle>
          <CardDescription>
            Standard text input fields with labels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="text-default">Default</Label>
            <Input type="text" id="text-default" placeholder="Enter text..." />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="text-email">Email</Label>
            <Input
              type="email"
              id="text-email"
              placeholder="user@example.com"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="text-password">Password</Label>
            <Input type="password" id="text-password" placeholder="********" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="text-disabled">Disabled</Label>
            <Input
              type="text"
              id="text-disabled"
              placeholder="Cannot edit"
              disabled
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="text-file">File</Label>
            <Input type="file" id="text-file" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">With Icon</CardTitle>
          <CardDescription>
            Input with an integrated search icon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-8" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Textarea</CardTitle>
          <CardDescription>
            Multi-line text input for longer content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-lg gap-1.5">
            <Label htmlFor="textarea-bio">Bio</Label>
            <Textarea
              id="textarea-bio"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-muted-foreground">
              Write a brief description.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select</CardTitle>
          <CardDescription>
            Dropdown selection from a list of options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm gap-1.5">
            <Label>Framework</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger>
                <SelectValue placeholder="Select a framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="vue">Vue</SelectItem>
                <SelectItem value="angular">Angular</SelectItem>
                <SelectItem value="svelte">Svelte</SelectItem>
                <SelectItem value="solid">Solid</SelectItem>
              </SelectContent>
            </Select>
            {framework && (
              <p className="text-xs text-muted-foreground">
                You selected:{" "}
                <span className="font-medium text-foreground capitalize">
                  {framework}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Form</CardTitle>
          <CardDescription>
            A complete interactive form example. Fill it out and submit!
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-lg gap-1.5">
              <Label htmlFor="form-name">Name</Label>
              <Input
                id="form-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="grid w-full max-w-lg gap-1.5">
              <Label htmlFor="form-email">Email</Label>
              <Input
                id="form-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid w-full max-w-lg gap-1.5">
              <Label htmlFor="form-message">Message</Label>
              <Textarea
                id="form-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName("");
                setEmail("");
                setMessage("");
              }}
            >
              Reset
            </Button>
            <Button type="submit">
              {submitted ? "Sent!" : "Send Message"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
