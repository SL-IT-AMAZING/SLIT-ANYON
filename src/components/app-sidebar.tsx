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
import { useTranslation } from "react-i18next";

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
import { SettingsDialog } from "./settings/SettingsDialog";
import { SubscriptionBanner } from "./subscription/SubscriptionBanner";

export function AppSidebar() {
  const { t } = useTranslation("app");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isHovering, state } = useSidebar();

  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isChatRoute = pathname === "/chat";
  const isAppDetailRoute =
    pathname.startsWith("/apps/") && pathname !== "/apps";

  const isCollapsedHover = state === "collapsed" && isHovering;

  const navItems = [
    {
      id: "home",
      title: t("nav.home"),
      to: "/",
      icon: Home,
    },
    {
      id: "apps",
      title: t("nav.apps"),
      to: "/apps",
      icon: Inbox,
    },
    {
      id: "library",
      title: t("nav.library"),
      to: "/themes",
      icon: BookOpen,
    },
    {
      id: "market",
      title: t("nav.market"),
      to: "/hub",
      icon: Store,
    },
    {
      id: "connect",
      title: t("nav.connect"),
      to: "/connect",
      icon: Plug,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas">
      {!isCollapsedHover && (
        <SidebarHeader className="p-4 pt-14">
          <img src={logo} alt={t("name")} className="h-8 w-auto" />
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                (item.to === "/" && pathname === "/") ||
                (item.to !== "/" && pathname.startsWith(item.to));

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton as={Link} to={item.to} isActive={isActive}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setIsSettingsOpen(true)}>
                <Settings className="size-4" />
                <span>{t("nav.settings")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="flex-1 overflow-y-auto">
          {(isChatRoute || isAppDetailRoute) && <ChatList />}
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
                  <span>{t("nav.signIn")}</span>
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
              <span>{t("nav.help")}</span>
            </SidebarMenuButton>
            <HelpDialog
              isOpen={isHelpDialogOpen}
              onClose={() => setIsHelpDialogOpen(false)}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </Sidebar>
  );
}
