"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadyBootstrapped, setAlreadyBootstrapped] = useState(false);
  const [loading, setLoading] = useState(false);

  const [setupToken, setSetupToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firebaseUid, setFirebaseUid] = useState("");

  useEffect(() => {
    fetch("/api/auth/bootstrap")
      .then((res) => res.json())
      .then((data) => {
        setAlreadyBootstrapped(data.isBootstrapped);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupToken || !name || !email) {
      toast.error("সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupToken,
          name,
          email,
          phone,
          firebaseUid: firebaseUid || `owner-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "সেটআপ ব্যর্থ হয়েছে");
      }

      toast.success("মালিক অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! লগইন করুন।");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        লোড হচ্ছে...
      </div>
    );
  }

  if (alreadyBootstrapped) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">সেটআপ ইতিমধ্যে সম্পন্ন হয়েছে</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            এই রেস্টুরেন্টের জন্য ইতিমধ্যে একজন সক্রিয় মালিক অ্যাকাউন্ট নিবন্ধিত আছে। সুরক্ষার জন্য
            সেটআপ উইজার্ডটি বন্ধ করা হয়েছে।
          </p>
          <Button onClick={() => router.push("/login")} variant="primary" className="w-full">
            লগইন পেজে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">প্রাথমিক মালিক সেটআপ (First Owner Setup)</h1>
          <p className="text-xs text-slate-500">
            Aulad IT Solution ক্লায়েন্ট অনবোর্ডিং - প্রথম মালিক অ্যাকাউন্ট তৈরি করুন
          </p>
        </div>

        <form onSubmit={handleBootstrap} className="space-y-4">
          <Input
            type="password"
            label="সেটআপ সিক্রেট টোকেন (SETUP_SECRET_TOKEN) *"
            placeholder="আপনার পরিবেশ ভেরিয়েবলের টোকেন"
            value={setupToken}
            onChange={(e) => setSetupToken(e.target.value)}
            required
          />

          <Input
            label="মালিকের পূর্ণ নাম *"
            placeholder="উদাঃ মোঃ আওলাদ হোসেন"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            type="email"
            label="মালিকের ইমেইল *"
            placeholder="owner@swadrestaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="মোবাইল নম্বর"
            placeholder="01700000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Firebase UID (ঐচ্ছিক)"
            placeholder="Firebase Auth UID বা ফাঁকা রাখুন"
            value={firebaseUid}
            onChange={(e) => setFirebaseUid(e.target.value)}
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full py-2.5 font-bold">
            মালিক অ্যাকাউন্ট নিশ্চিত ও সক্রিয় করুন
          </Button>
        </form>
      </div>
    </div>
  );
}
