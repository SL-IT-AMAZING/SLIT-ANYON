import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronRight,
  Download,
  Heart,
  Loader2,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export function ButtonPreview() {
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Buttons</h2>
        <p className="text-muted-foreground mt-1">
          Clickable elements for actions and form submissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variants</CardTitle>
          <CardDescription>
            Different button styles for various contexts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sizes</CardTitle>
          <CardDescription>
            Buttons come in small, default, large, and icon sizes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">With Icons</CardTitle>
          <CardDescription>
            Buttons paired with icons for additional context.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="secondary">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interactive</CardTitle>
          <CardDescription>
            Try clicking these buttons to see interactive behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => setClickCount((c) => c + 1)}>
              Click me
            </Button>
            <span className="text-sm text-muted-foreground">
              Clicked{" "}
              <span className="font-semibold text-foreground">
                {clickCount}
              </span>{" "}
              time{clickCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLiked((l) => !l)}
              className={liked ? "text-red-500 border-red-200" : ""}
            >
              <Heart
                className={`mr-2 h-4 w-4 ${liked ? "fill-red-500" : ""}`}
              />
              {liked ? "Liked" : "Like"}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleLoadingClick} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Processing..." : "Submit"}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
