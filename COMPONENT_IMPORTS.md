# UI Component Import Reference

## Quick Import Copy-Paste

### All Components at Once

```tsx
import {
  // Layout
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,

  // Forms
  Input,
  Textarea,
  Label,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,

  // Display
  Badge,
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,
  Separator,
  ScrollArea,

  // Menus
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,

  // Custom
  Button,
  buttonVariants,
  LoadingBar,
  ColorPicker,
  NumberInput,
  SimpleAvatar,
} from "@/components/ui";
```

## By Use Case

### Building a Chat Message UI

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

### Building Chat Input Area

```tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
```

### Building a Settings/Configuration Panel

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
```

### Building a Dialog/Modal

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
```

### Building Loading States

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBar } from "@/components/ui/LoadingBar";
```

### Building Dropdown Menus

```tsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
```

### Building Alerts & Error Messages

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
```

### Building Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

### Building Accordion (Collapsible Sections)

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
```

### Building a Command Palette / Search

```tsx
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
```

### Building Markdown Display

```tsx
// No special import needed - just use prose classes
className =
  "prose dark:prose-invert prose-headings:mb-2 prose-p:my-1 prose-pre:my-0 max-w-none break-words";
```

## Utility Functions

### For styling/composition

```tsx
import { cn } from "@/lib/utils";
```

### For color picker

```tsx
import { ColorPicker } from "@/components/ui/ColorPicker";
```

### For number inputs

```tsx
import { NumberInput } from "@/components/ui/NumberInput";
```

### For avatars

```tsx
import { SimpleAvatar } from "@/components/ui/SimpleAvatar";
```

## Theme & Context

```tsx
import { useTheme } from "@/contexts/ThemeContext";
```

Usage:

```tsx
const { theme, isDarkMode, setTheme } = useTheme();
```

## Animation Libraries

### Framer Motion (for complex animations)

```tsx
import { motion } from "framer-motion";
```

### Tailwind Animation Classes (for simple animations)

- Just add to className: `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, etc.

---

## Complete Example: Chat Component

```tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ChatInterface() {
  const [messages, setMessages] = React.useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <Card
              className={cn(
                "max-w-2xl",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card",
              )}
            >
              <CardContent className="pt-6 prose dark:prose-invert max-w-none break-words">
                {msg.content}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                Send
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message (Ctrl+Enter)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
```

---

## Component Sizing Reference

### Button Sizes

- `size="xs"` - 6px height, compact
- `size="sm"` - 8px height, small
- `size="default"` - 9px height, standard
- `size="lg"` - 10px height, large
- `size="icon"` - Square icon buttons
- `size="icon-xs"` - 6px square
- `size="icon-sm"` - 8px square
- `size="icon-lg"` - 10px square

### Button Variants

- `variant="default"` - Primary color
- `variant="destructive"` - Red/orange for dangerous actions
- `variant="outline"` - Border only
- `variant="secondary"` - Secondary color
- `variant="ghost"` - No background, hover only
- `variant="link"` - Text link style

---

## State-Based Animation Classes (Base UI)

For components using Base UI primitives (Dialog, Tooltip, Select, etc.):

```
data-open:animate-in
data-closed:animate-out
data-open:fade-in-0
data-closed:fade-out-0
data-open:zoom-in-95
data-closed:zoom-out-95
data-[side=top]:slide-in-from-bottom-2
data-[side=bottom]:slide-in-from-top-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
```
