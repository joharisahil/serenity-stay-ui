import {
  Home,
  Hotel,
  Calendar,
  UtensilsCrossed,
  Receipt,
  Package,
  ChefHat,
  ChevronDown,
  Table2Icon,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  {
    title: "Room Management",
    icon: Hotel,
    submenu: [
      { title: "Manage Rooms", url: "/rooms/manage" },
      { title: "Room Bookings", url: "/rooms/bookings" },
      { title: "Room Bills", url: "/rooms/bills" },
    ],
  },
  {
    title: "Table Management",
    icon: Table2Icon,
    submenu: [
      { title: "Manage Tables", url: "/tables/manage" },
      { title: "Table Bookings", url: "/tables/bookings" },
    ],
  },
  { title: "Banquet Booking", url: "/banquet", icon: Calendar },
  { title: "Menu Management", url: "/menu", icon: UtensilsCrossed },
  {
    title: "Billing",
    icon: Receipt,
    submenu: [
      { title: "Restaurant Bill", url: "/billing" },
      { title: "Old Bills", url: "/old-bills" },
    ],
  },
  { title: "Kitchen Orders", url: "/kitchen", icon: ChefHat },
  { title: "Inventory", url: "/inventory", icon: Package },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isSubmenuActive = (submenu: any[]) =>
    submenu.some((item) => location.pathname.startsWith(item.url));

  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.submenu && isSubmenuActive(item.submenu)) {
        setExpandedMenus((prev) => [...new Set([...prev, item.title])]);
      }
    });
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-64",
          "hidden lg:flex lg:flex-col",
          "h-full border-r",
        )}
      >
        {/* Desktop Sidebar */}
        <SidebarContent
          collapsed={collapsed}
          expandedMenus={expandedMenus}
          toggleSubmenu={toggleSubmenu}
          setCollapsed={setCollapsed}
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          collapsed={false}
          expandedMenus={expandedMenus}
          toggleSubmenu={toggleSubmenu}
          onClose={onClose}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  expandedMenus,
  toggleSubmenu,
  setCollapsed,
  onClose,
}: any) {
  return (
    <>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {/* Logo Section */}
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Show full logo only when expanded */}
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sidebar-accent">
                <Hotel className="h-5 w-5 text-sidebar-primary" />
              </div>

              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold tracking-tight">
                  Hotel PMS
                </span>
              </div>
            </div>
          )}

          {/* Show only icon when collapsed */}
          {collapsed && (
            <div className="p-2 rounded-lg bg-sidebar-accent">
              <Hotel className="h-5 w-5 text-sidebar-primary" />
            </div>
          )}
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-2">
          {setCollapsed && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCollapsed((prev: boolean) => !prev)}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}

          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleSubmenu(item.title)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent"
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && <span>{item.title}</span>}
                  {!collapsed && <ChevronDown className="ml-auto h-4 w-4" />}
                </button>

                {!collapsed && expandedMenus.includes(item.title) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu.map((subItem: any) => (
                      <NavLink
                        key={subItem.url}
                        to={subItem.url}
                        className="block px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sm"
                      >
                        {subItem.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.url}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent"
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
