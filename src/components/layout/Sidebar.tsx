"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  UtensilsCrossed,
  ChefHat,
  MenuSquare,
  Boxes,
  Truck,
  Wallet,
  Users,
  Clock,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  LogOut,
  Store,
} from "lucide-react";
import { Permission } from "@/types";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  permission?: Permission;
}

export function Sidebar({
  restaurantName = "স্বাদ রেস্টুরেন্ট",
  onCloseMobile,
}: {
  restaurantName?: string;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user, hasPermission, logout, loading } = useAuth();

  const navItems: NavItem[] = [
    { title: "ড্যাশবোর্ড", href: "/", icon: LayoutDashboard, permission: "dashboard:view" },
    { title: "POS কাউন্টার", href: "/pos", icon: ShoppingCart, permission: "pos:access" },
    { title: "অর্ডার তালিকা", href: "/orders", icon: Receipt, permission: "orders:read" },
    { title: "টেবিল", href: "/tables", icon: UtensilsCrossed, permission: "tables:manage" },
    { title: "কিচেন ডিসপ্লে", href: "/kitchen", icon: ChefHat, permission: "kitchen:access" },
    { title: "মেনু ম্যানেজমেন্ট", href: "/menu", icon: MenuSquare, permission: "menu:manage" },
    { title: "ইনভেন্টরি ও স্টক", href: "/inventory", icon: Boxes, permission: "inventory:manage" },
    { title: "সাপ্লায়ার ক্রয়", href: "/purchases", icon: Truck, permission: "purchases:manage" },
    { title: "দৈনিক খরচ", href: "/expenses", icon: Wallet, permission: "expenses:manage" },
    { title: "কাস্টমার", href: "/customers", icon: Users, permission: "customers:manage" },
    { title: "ক্যাশ শিফট", href: "/shifts", icon: Clock, permission: "shifts:manage" },
    { title: "রিপোর্ট ও লাভ", href: "/reports", icon: BarChart3, permission: "reports:view" },
    { title: "কর্মী ও রোল", href: "/users", icon: UserCog, permission: "users:manage" },
    { title: "অডিট লগ", href: "/audit-logs", icon: ShieldCheck, permission: "audit:view" },
    { title: "সেটিংস", href: "/settings", icon: Settings, permission: "settings:manage" },
  ];

  // Filter items based on user's active permissions
  const allowedItems = navItems.filter((item) => {
    // If still resolving authentication, don't flash an empty sidebar
    if (loading) return true;

    // In local development, if no user is authenticated yet, default to all items so navigation works
    if (!user && process.env.NODE_ENV !== "production") return true;

    // In production, unauthenticated users can still view fundamental operational routes
    if (!user) {
      return ["/", "/pos", "/orders"].includes(item.href);
    }

    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
          <Store className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-base text-white truncate leading-tight">
            {restaurantName}
          </h1>
          <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
            POS ও ম্যানেজমেন্ট
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40">
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{user?.name || "ইউজার"}</div>
            <div className="text-[10px] text-amber-400 truncate font-mono">
              {user?.role || "GUEST"}
            </div>
          </div>
          <button
            onClick={async () => {
              toast.success("লগআউট হচ্ছে...");
              await logout();
            }}
            title="লগআউট করুন"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
