"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import {
  Search,
  Bell,
  Menu,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
  Clock,
  Sparkles,
  X,
  LogOut,
  ChevronDown,
  UserCheck,
  Link2,
} from "lucide-react";
import { UserRole, INotification } from "@/types";
import { ROLE_NAMES_BN } from "@/lib/permissions/rbac";
import { formatBDT } from "@/lib/calculations/financial";

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const router = useRouter();
  const { user, isAnonymous, linkWithGoogle, devLogin, logout } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User profile menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Active shift state
  const [shiftStatus, setShiftStatus] = useState<string>("CLOSED");

  // Fetch notifications and shift
  useEffect(() => {
    const fetchData = async () => {
      try {
        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }

        const shiftRes = await fetch("/api/shifts?current=true");
        if (shiftRes.ok) {
          const data = await shiftRes.json();
          setShiftStatus(data.shift ? "OPEN" : "CLOSED");
        }
      } catch {
        // Ignore fetch errors during navigation
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Search debouncing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
          setSearchOpen(true);
        }
      } catch {
        // Ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllNotifications = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  const handleDevRoleChange = async (role: UserRole) => {
    await devLogin(role);
    window.location.reload();
  };

  const handleLogout = async () => {
    toast.success("লগআউট হচ্ছে...");
    await logout();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Mobile Toggle & Global Omni-Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobile}
          className="p-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setSearchOpen(true);
              }}
              placeholder="অর্ডার নম্বর, ফোন, কাস্টমার, মেনু বা সাপ্লায়ার খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border border-transparent rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchOpen && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 max-h-96 overflow-y-auto z-50 animate-in fade-in">
              {/* Orders */}
              {searchResults.orders?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    অর্ডার
                  </div>
                  {searchResults.orders.map((o: any) => (
                    <div
                      key={o._id}
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/orders?search=${o.orderNumber}`);
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-bold text-emerald-700">
                        {o.orderNumber}
                      </span>
                      <span className="text-slate-500">{o.customerName || "গেস্ট"}</span>
                      <span className="font-mono">{formatBDT(o.grandTotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customers */}
              {searchResults.customers?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    কাস্টমার
                  </div>
                  {searchResults.customers.map((c: any) => (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/customers?search=${c.phone}`);
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="font-mono text-slate-500">{c.phone}</span>
                      {c.totalDue > 0 && (
                        <span className="text-rose-600 font-bold">বাকি: {formatBDT(c.totalDue)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Menu Items */}
              {searchResults.menuItems?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    মেনু আইটেম
                  </div>
                  {searchResults.menuItems.map((m: any) => (
                    <div
                      key={m._id}
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/pos?search=${m.nameBn}`);
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-800">{m.nameBn}</span>
                      <span className="font-mono text-emerald-600 font-bold">{formatBDT(m.basePrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suppliers */}
              {searchResults.suppliers?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    সাপ্লায়ার
                  </div>
                  {searchResults.suppliers.map((s: any) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/purchases?supplierId=${s._id}`);
                      }}
                      className="px-2.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{s.company}</span>
                      <span className="font-mono text-slate-500">{s.phone}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.orders?.length === 0 &&
                searchResults.customers?.length === 0 &&
                searchResults.menuItems?.length === 0 &&
                searchResults.suppliers?.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    কোন ফলাফল পাওয়া যায়নি
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Cash Shift Quick Indicator */}
        <Link
          href="/shifts"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            shiftStatus === "OPEN"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>শিফট: {shiftStatus === "OPEN" ? "চালু" : "বন্ধ"}</span>
        </Link>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">বিজ্ঞপ্তি</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadCount} নতুন
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotifications}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    সব পঠিত
                  </button>
                )}
              </div>

              <div className="py-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    কোন নতুন বিজ্ঞপ্তি নেই
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        !n.read ? "bg-emerald-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        {n.type === "LOW_STOCK" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString("en-GB")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Development Role Quick Switcher */}
        {process.env.NODE_ENV !== "production" && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-800 font-medium">রোল:</span>
            <select
              value={user?.role || "OWNER"}
              onChange={(e) => handleDevRoleChange(e.target.value as UserRole)}
              className="bg-transparent font-bold text-amber-900 focus:outline-none cursor-pointer"
            >
              <option value="OWNER">মালিক (Owner)</option>
              <option value="MANAGER">ম্যানেজার (Manager)</option>
              <option value="CASHIER">ক্যাশিয়ার (Cashier)</option>
              <option value="WAITER">ওয়েটার (Waiter)</option>
              <option value="KITCHEN">কিচেন (Kitchen)</option>
              <option value="INVENTORY_MANAGER">ইনভেন্টরি ম্যানেজার</option>
            </select>
          </div>
        )}

        {/* Active User Avatar & Profile Menu */}
        <div ref={userMenuRef} className="relative flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.slice(0, 1) : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || "অতিথি"}
                </span>
                {(isAnonymous || user?.isAnonymous) && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-sm">
                    গেস্ট
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {user?.role ? ROLE_NAMES_BN[user.role] || user.role : "নিয়মিত ব্যবহারকারী"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Direct Quick Logout Button in Header */}
          <button
            onClick={handleLogout}
            title="লগআউট করুন"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900">{user?.name || "অতিথি"}</div>
                  {(isAnonymous || user?.isAnonymous) && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                      অ্যানোনিমাস
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {user?.role ? ROLE_NAMES_BN[user.role] || user.role : "GUEST"}
                </span>
              </div>

              {(isAnonymous || user?.isAnonymous) && (
                <div className="p-2.5 mb-2 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>অস্থায়ী গেস্ট সেশন</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-tight">
                    ডাটা স্থায়ী রাখতে গুগল অ্যাকাউন্টের সাথে লিঙ্ক করতে পারেন।
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await linkWithGoogle();
                        toast.success("সফলভাবে গুগল অ্যাকাউন্টের সাথে যুক্ত হয়েছে!");
                      } catch (err: any) {
                        toast.error(err?.message || "লিঙ্ক করতে ব্যর্থ হয়েছে");
                      }
                    }}
                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    গুগল দিয়ে পার্মানেন্ট করুন
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>প্রোফাইল ও সেটিংস</span>
                </Link>

                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>লগআউট করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
