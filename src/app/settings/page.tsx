"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Settings, Save, Shield, Store, Sliders, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        setSettings(json.settings);
      }
    } catch {
      toast.error("সেটিংস লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "সেটিংস সংরক্ষণ ব্যর্থ");

      toast.success("রেস্টুরেন্ট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-400">সেটিংস লোড হচ্ছে...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">রেস্টুরেন্ট সেটিংস</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ব্র্যান্ডিং, ভ্যাট ও সার্ভিস চার্জ এবং প্যাকেজ ফিচার ফ্ল্যাগ কনফিগারেশন
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            loading={saving}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" /> সেটিংস সংরক্ষণ করুন
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Profile & Branding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-800">
                  রেস্টুরেন্টের পরিচিতি ও ব্র্যান্ডিং
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="বাংলা নাম *"
                  value={settings.nameBn || ""}
                  onChange={(e) => setSettings({ ...settings, nameBn: e.target.value })}
                  required
                />
                <Input
                  label="ইংরেজি নাম *"
                  value={settings.name || ""}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  required
                />
              </div>

              <Input
                label="ট্যাগলাইন / স্লোগান"
                value={settings.tagline || ""}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="অফিসিয়াল ফোন নম্বর *"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  label="অফিসিয়াল ইমেইল"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>

              <Input
                label="রেস্টুরেন্টের সম্পূর্ণ ঠিকানা *"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                required
              />
            </CardContent>
          </Card>

          {/* Section 2: POS Billing & Tax Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-sm text-slate-800">
                  POS বিলিং, ভ্যাট ও সার্ভিস চার্জ
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* VAT */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.vatEnabled || false}
                    onChange={(e) => setSettings({ ...settings, vatEnabled: e.target.checked })}
                    className="rounded-sm text-emerald-600"
                  />
                  <span>মূল্যের উপর সরকারী ভ্যাট (VAT) প্রযোজ্য</span>
                </label>

                {settings.vatEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      label="ভ্যাট শতকরা হার (%) *"
                      value={settings.vatRate || 5}
                      onChange={(e) =>
                        setSettings({ ...settings, vatRate: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                    <Input
                      label="ভ্যাট নিবন্ধন নম্বর (BIN / VAT Registration)"
                      placeholder="BIN-123456789"
                      value={settings.vatRegistrationNumber || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, vatRegistrationNumber: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Service Charge */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.serviceChargeEnabled || false}
                    onChange={(e) =>
                      setSettings({ ...settings, serviceChargeEnabled: e.target.checked })
                    }
                    className="rounded-sm text-emerald-600"
                  />
                  <span>সার্ভিস চার্জ (Service Charge) প্রযোজ্য</span>
                </label>

                {settings.serviceChargeEnabled && (
                  <div className="pt-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      label="সার্ভিস চার্জ শতকরা হার (%) *"
                      value={settings.serviceChargeRate || 5}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          serviceChargeRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <Input
                label="রসিদের নিচের শুভেচ্ছা বার্তা (বাংলা)"
                value={settings.receiptFooterMessageBn || ""}
                onChange={(e) =>
                  setSettings({ ...settings, receiptFooterMessageBn: e.target.value })
                }
              />
            </CardContent>
          </Card>

          {/* Section 3: Feature Flags (Section 29) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <h2 className="font-bold text-sm text-slate-800">
                    ফিচার ফ্ল্যাগ (Feature Flags & Modules)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Aulad IT Solution প্যাকেজ নিয়ন্ত্রণ: Basic, Standard ও Premium গ্রাহকের জন্য মডিউল সক্রিয়/নিষ্ক্রিয় করুন
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "inventory", label: "ইনভেন্টরি ও কাঁচামাল স্টক" },
                  { key: "autoIngredientDeduction", label: "বিক্রির সাথে স্বয়ংক্রিয় স্টক কর্তন" },
                  { key: "kitchenDisplay", label: "কিচেন ডিসপ্লে সিস্টেম (KDS)" },
                  { key: "purchaseManagement", label: "সাপ্লায়ার ক্রয় ও হিসাব" },
                  { key: "expenseManagement", label: "দৈনিক খরচ হিসাব" },
                  { key: "customerManagement", label: "কাস্টমার ডিরেক্টরি ও বাকি ট্র্যাকিং" },
                  { key: "shiftManagement", label: "ক্যাশ শিফট ও রেজিস্টার" },
                  { key: "advancedReports", label: "উন্নত লাভ-ক্ষতি ও আর্থিক রিপোর্ট" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="font-semibold text-slate-800">{label}</span>
                    <input
                      type="checkbox"
                      checked={settings.features?.[key] ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          features: {
                            ...settings.features,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
