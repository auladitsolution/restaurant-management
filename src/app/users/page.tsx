"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { IUser, UserRole } from "@/types";
import { ROLE_NAMES_BN } from "@/lib/permissions/rbac";
import { toast } from "sonner";
import { UserCog, Plus, Shield, RefreshCw, UserX, UserCheck } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal
  const [createModal, setCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("CASHIER");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      toast.error("ব্যবহারকারীদের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: `user-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
          active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "কর্মী তৈরি ব্যর্থ");

      toast.success("কর্মী সফলভাবে তৈরি করা হয়েছে!");
      setCreateModal(false);
      setName("");
      setEmail("");
      setPhone("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserActive = async (user: IUser) => {
    try {
      const res = await fetch(`/api/auth/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ");

      toast.success(
        !user.active ? `${user.name} সক্রিয় করা হয়েছে` : `${user.name} নিষ্ক্রিয় করা হয়েছে`
      );
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              কর্মী ও ব্যবহারকারী ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              রেস্টুরেন্ট কর্মীদের রোল অ্যাসাইনমেন্ট, দায়িত্ব ও সক্রিয়তা নিয়ন্ত্রণ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setCreateModal(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> নতুন কর্মী যোগ
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">নাম</th>
                  <th className="p-3">ইমেইল</th>
                  <th className="p-3">মোবাইল নম্বর</th>
                  <th className="p-3">ভূমিকা / রোল</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600 font-mono">{u.email}</td>
                      <td className="p-3 text-slate-600 font-mono">{u.phone || "—"}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {ROLE_NAMES_BN[u.role] || u.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {u.active ? (
                          <Badge variant="success">সক্রিয়</Badge>
                        ) : (
                          <Badge variant="danger">নিষ্ক্রিয়</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleUserActive(u)}
                          title={u.active ? "নিষ্ক্রিয় করুন" : "পুনরায় সক্রিয় করুন"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.active
                              ? "text-rose-500 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create User Modal */}
        <Dialog
          open={createModal}
          onClose={() => setCreateModal(false)}
          title="নতুন কর্মী অ্যাকাউন্ট তৈরি"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <Input
              label="কর্মীর নাম *"
              placeholder="উদাঃ মোঃ আরিফুল ইসলাম"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="email"
              label="ইমেইল *"
              placeholder="employee@restaurant.com"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                দায়িত্ব ও রোল (Role) *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="MANAGER">ম্যানেজার (Manager)</option>
                <option value="CASHIER">ক্যাশিয়ার (Cashier)</option>
                <option value="WAITER">ওয়েটার (Waiter)</option>
                <option value="KITCHEN">কিচেন স্টাফ (Kitchen)</option>
                <option value="INVENTORY_MANAGER">ইনভেন্টরি ম্যানেজার</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                অ্যাকাউন্ট তৈরি করুন
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
