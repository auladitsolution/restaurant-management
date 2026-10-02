"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  ChefHat,
  UtensilsCrossed,
  X,
  Loader2,
} from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const mobileNavItems = [
    { title: "ড্যাশবোর্ড", href: "/", icon: LayoutDashboard },
    { title: "POS", href: "/pos", icon: ShoppingCart },
    { title: "অর্ডার", href: "/orders", icon: Receipt },
    { title: "টেবিল", href: "/tables", icon: UtensilsCrossed },
    { title: "কিচেন", href: "/kitchen", icon: ChefHat },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-9 h-9 text-emerald-500 animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-300">যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-white z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Section 38 & 39) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-40 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                  isActive ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
