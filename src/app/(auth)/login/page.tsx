"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Store, LogIn, Sparkles, Shield, User, UtensilsCrossed, ChefHat, Boxes, UserCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithGoogleRedirect, loginWithEmail, loginAnonymously, devLogin, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAnonAlert, setShowAnonAlert] = useState(false);

  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "restaurant-management-ae314";

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
      console.error("Google sign-in error:", err);
      let msg = err?.message || "গুগল লগইন ব্যর্থ হয়েছে";
      if (err?.code === "auth/popup-closed-by-user") {
        msg = "লগইন পপআপ উইন্ডোটি বন্ধ করা হয়েছে অথবা ব্লক হয়েছে। নিচের 'রিডাইরেক্ট দিয়ে লগইন' চেষ্টা করুন।";
      } else if (err?.code === "auth/unauthorized-domain") {
        msg = "Firebase Authentication এ বর্তমান ডোমেইনটি অনুমোদিত নয়। (Firebase Console > Auth > Settings > Authorized domains এ localhost বা ডোমেইন যোগ করুন)";
      } else if (err?.code === "auth/operation-not-allowed" || err?.code === "auth/configuration-not-found") {
        msg = "Firebase Console এ Google Sign-in Provider এনেবল করা নেই।";
      } else if (err?.code === "auth/popup-blocked") {
        msg = "ব্রাউজার পপআপ ব্লক করেছে। নিচের 'রিডাইরেক্ট দিয়ে লগইন' চেষ্টা করুন।";
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error("Google redirect sign-in error:", err);
      toast.error(err?.message || "গুগল রিডাইরেক্ট লগইন ব্যর্থ হয়েছে");
      setSubmitting(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setSubmitting(true);
    setShowAnonAlert(false);
    try {
      await loginAnonymously();
      toast.success("গেস্ট হিসেবে সফলভাবে প্রবেশ করেছেন!");
      router.push("/");
    } catch (err: any) {
      console.error("Anonymous login error:", err);
      const isRestricted =
        err?.code === "auth/admin-restricted-operation" ||
        err?.code === "auth/operation-not-allowed";

      if (isRestricted) {
        setShowAnonAlert(true);
        toast.error("Firebase Console এ Anonymous সাইন-ইন চালু (Enable) করা নেই!");
      } else {
        toast.error(err?.message || "গেস্ট লগইন ব্যর্থ হয়েছে");
      }
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
        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-2.5 font-medium text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন
          </Button>

          <button
            type="button"
            onClick={handleGoogleRedirectLogin}
            disabled={submitting}
            className="w-full text-center text-[11px] text-slate-500 hover:text-emerald-700 hover:underline py-0.5"
          >
            পপআপে সমস্যা হচ্ছে? এখানে ক্লিক করে রিডাইরেক্ট দিয়ে লগইন করুন
          </button>
        </div>

        {/* Anonymous / Guest Sign In */}
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleAnonymousLogin}
            disabled={submitting}
            className="w-full py-2.5 font-semibold text-xs text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            গেস্ট হিসেবে প্রবেশ করুন (Anonymous Sign-In)
          </Button>
          <p className="text-[11px] text-center text-slate-400">
            কোনো ইমেইল বা পাসওয়ার্ড ছাড়াই তাৎক্ষণিক POS ট্রাই করুন
          </p>
        </div>

        {/* Firebase Console Anonymous Enable Alert */}
        {showAnonAlert && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2 text-rose-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Firebase-এ Anonymous Sign-in চালু নেই</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Firebase Console এ <b>Anonymous</b> প্রোভাইডার সক্রিয় করতে হবে:
              <br />
              <b>Authentication &gt; Sign-in method &gt; Anonymous &gt; Enable</b>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span>Firebase Console খুলুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {process.env.NODE_ENV !== "production" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickDevLogin("CASHIER")}
                  className="py-1.5 px-2.5 text-[11px] bg-white text-slate-700 hover:bg-slate-50 border-rose-300"
                >
                  টেস্ট গেস্ট হিসেবে প্রবেশ
                </Button>
              )}
            </div>
          </div>
        )}

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
