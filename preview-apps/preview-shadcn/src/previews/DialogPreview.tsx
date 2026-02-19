import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useState } from "react";

export function DialogPreview() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dialogs</h2>
        <p className="text-muted-foreground mt-1">
          Modal windows for focused interactions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Dialog</CardTitle>
          <CardDescription>
            A simple dialog with a title, description, and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Welcome!</DialogTitle>
                <DialogDescription>
                  This is a basic dialog component. It overlays the page content
                  and focuses the user's attention on a specific task.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Dialogs can contain any content, including text, forms, and
                  interactive elements. Click the X button or press Escape to
                  close.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit Profile Dialog</CardTitle>
          <CardDescription>
            A dialog with a form for editing profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dialog-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="dialog-name"
                    defaultValue="John Doe"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dialog-username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="dialog-username"
                    defaultValue="@johndoe"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dialog-bio" className="text-right">
                    Bio
                  </Label>
                  <Textarea
                    id="dialog-bio"
                    defaultValue="I love building things."
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Issue Dialog</CardTitle>
          <CardDescription>
            A more complex dialog with multiple form fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Report Issue</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
                <DialogDescription>
                  Describe the issue you're experiencing. We'll investigate as
                  soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dialog-title">Title</Label>
                  <Input
                    id="dialog-title"
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dialog-desc">Description</Label>
                  <Textarea
                    id="dialog-desc"
                    placeholder="Provide details about the issue..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Submit Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Destructive Confirmation</CardTitle>
          <CardDescription>
            A confirmation dialog for dangerous actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all of your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleted(true);
                    setDeleteOpen(false);
                    setTimeout(() => setDeleted(false), 3000);
                  }}
                >
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {deleted && (
            <p className="text-sm text-destructive font-medium">
              Account deleted! (just kidding, this is a demo)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
