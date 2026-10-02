"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Store, LogIn, Sparkles, Shield, User, UtensilsCrossed, ChefHat, Boxes } from "lucide-react";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail, devLogin, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("ইমেইল এবং পাসওয়ার্ড প্রদান করুন");
      return;
    }
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      toast.success("সফলভাবে লগইন হয়েছে!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "লগইন ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("গুগল দিয়ে সফলভাবে লগইন হয়েছে!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "গুগল লগইন ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDevLogin = async (role: UserRole) => {
    setSubmitting(true);
    try {
      await devLogin(role);
      toast.success(`${role} হিসেবে টেস্ট লগইন সম্পন্ন!`);
      router.push("/");
    } catch {
      toast.error("টেস্ট লগইন ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">স্বাদ রেস্টুরেন্ট POS</h1>
          <p className="text-xs text-slate-500">
            রেস্টুরেন্ট ম্যানেজমেন্ট ও পয়েন্ট অব সেলস সিস্টেমে স্বাগতম
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            label="ইমেইল ঠিকানা"
            placeholder="name@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            label="পাসওয়ার্ড"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            loading={submitting || loading}
            className="w-full py-2.5 font-semibold text-sm"
          >
            <LogIn className="w-4 h-4 mr-2" /> লগইন করুন
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">অথবা</span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full py-2.5 font-medium text-xs text-slate-700 hover:bg-slate-50"
        >
          গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন
        </Button>

        {/* Development Quick Role Switcher */}
        {process.env.NODE_ENV !== "production" && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ডেভেলপমেন্ট ১-ক্লিক টেস্ট লগইন:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickDevLogin("OWNER")}
                className="justify-start gap-1.5 text-xs bg-white text-emerald-800 font-bold"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> মালিক (Owner)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickDevLogin("MANAGER")}
                className="justify-start gap-1.5 text-xs bg-white text-slate-700"
              >
                <User className="w-3.5 h-3.5 text-sky-600" /> ম্যানেজার
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickDevLogin("CASHIER")}
                className="justify-start gap-1.5 text-xs bg-white text-slate-700"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-600" /> ক্যাশিয়ার
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickDevLogin("WAITER")}
                className="justify-start gap-1.5 text-xs bg-white text-slate-700"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-purple-600" /> ওয়েটার
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickDevLogin("KITCHEN")}
                className="justify-start gap-1.5 text-xs bg-white text-slate-700"
              >
                <ChefHat className="w-3.5 h-3.5 text-rose-600" /> কিচেন স্টাফ
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickDevLogin("INVENTORY_MANAGER")}
                className="justify-start gap-1.5 text-xs bg-white text-slate-700"
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-600" /> ইনভেন্টরি
              </Button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-[11px] text-slate-400">
            কারিগরি সহায়তায়: <span className="font-semibold text-slate-600">Aulad IT Solution</span>
          </p>
        </div>
      </div>
    </div>
  );
}
