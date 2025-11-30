import {
  Home,
  Hotel,
  Calendar,
  UtensilsCrossed,
  Receipt,
  Package,
  ChefHat,
  Menu as MenuIcon,
  ChevronDown,
  Table2Icon
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
    ],
  },
    {
    title: "Table Management",
    icon:   Table2Icon,
    submenu: [
      { title: "Manage Tables", url: "/tables/manage" },
      { title: "Table Bookings", url: "/tables/bookings" },
    ],
  },
  { title: "Banquet Booking", url: "/banquet", icon: Calendar },
  { title: "Menu Management", url: "/menu", icon: UtensilsCrossed },
  {
    title: "Billing",
    icon:   Receipt,
    submenu: [
      { title: "Restaurant bill", url: "/billing" },
      { title: "Old bill", url: "/old-bills" },
    ],
  },
  { title: "Kitchen Orders", url: "/kitchen", icon: ChefHat },
 // { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Inventory", url: "/inventory", icon: Package },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isSubmenuActive = (submenu: { title: string; url: string }[]) => {
    return submenu.some((item) => location.pathname.startsWith(item.url));
  };

  // Auto-expand menus if current route matches submenu
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
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:sticky lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2">
            <Hotel className="h-6 w-6 text-sidebar-primary" />
            <span className="text-lg font-bold whitespace-nowrap">Hotel PMS</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navigationItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <>
                  {/* Parent Menu Button */}
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                      isSubmenuActive(item.submenu) && "bg-sidebar-accent font-medium"
                    )}
                  >
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedMenus.includes(item.title) && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Submenu */}
                  {expandedMenus.includes(item.title) && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-4">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.url}
                          to={subItem.url}
                          className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent font-medium"
                          onClick={() => {
                            if (window.innerWidth < 1024) {
                              onClose();
                            }
                          }}
                        >
                          <span>{subItem.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.url!}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sidebar-foreground transition-colors hover:bg-sidebar-accent whitespace-nowrap"
                  activeClassName="bg-sidebar-accent font-medium"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
