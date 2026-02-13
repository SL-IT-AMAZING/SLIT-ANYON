import { useAuth } from "@/hooks/useAuth";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  HelpCircle,
  Home,
  Inbox,
  LogIn,
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
import { AccountMenu } from "./auth/AccountMenu";
import { LoginDialog } from "./auth/LoginDialog";
import { SubscriptionBanner } from "./subscription/SubscriptionBanner";

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
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();
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

      <SidebarFooter className="space-y-1">
        <SubscriptionBanner />
        <SidebarMenu>
          <SidebarMenuItem>
            {isAuthenticated ? (
              <AccountMenu />
            ) : (
              <>
                <SidebarMenuButton onClick={() => setIsLoginDialogOpen(true)}>
                  <LogIn className="size-4" />
                  <span>Sign In</span>
                </SidebarMenuButton>
                <LoginDialog
                  isOpen={isLoginDialogOpen}
                  onClose={() => setIsLoginDialogOpen(false)}
                />
              </>
            )}
          </SidebarMenuItem>
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
