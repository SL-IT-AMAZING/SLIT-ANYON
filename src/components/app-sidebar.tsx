import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  HelpCircle,
  Home,
  Inbox,
  Plug,
  Settings,
  Store,
} from "lucide-react";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
// @ts-ignore
import logo from "../../img/logo3.svg";
import { ChatList } from "./ChatList";
import { HelpDialog } from "./HelpDialog";

// Menu items.
const items = [
  {
    title: "Home",
    to: "/",
    icon: Home,
  },
  {
    title: "Chat",
    to: "/chat",
    icon: Inbox,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: Settings,
  },
  {
    title: "Library",
    to: "/themes",
    icon: BookOpen,
  },
  {
    title: "Market",
    to: "/hub",
    icon: Store,
  },
  {
    title: "Connect",
    to: "/connect",
    icon: Plug,
  },
];

export function AppSidebar() {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const { isHovering, state } = useSidebar();

  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isChatRoute = pathname === "/chat";

  const isCollapsedHover = state === "collapsed" && isHovering;

  return (
    <Sidebar collapsible="offcanvas">
      {!isCollapsedHover && (
        <SidebarHeader className="p-4 pt-14">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              const isActive =
                (item.to === "/" && pathname === "/") ||
                (item.to !== "/" && pathname.startsWith(item.to));

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton as={Link} to={item.to} isActive={isActive}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="flex-1 overflow-y-auto">
          {isChatRoute && <ChatList />}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setIsHelpDialogOpen(true)}>
              <HelpCircle className="size-4" />
              <span>Help</span>
            </SidebarMenuButton>
            <HelpDialog
              isOpen={isHelpDialogOpen}
              onClose={() => setIsHelpDialogOpen(false)}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
