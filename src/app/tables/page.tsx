"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ITable, IFloor, TableStatus } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Users,
  Plus,
  RefreshCw,
  MoveRight,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<ITable[]>([]);
  const [floors, setFloors] = useState<IFloor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modals
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableFloor, setNewTableFloor] = useState("Ground Floor");
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [submittingTable, setSubmittingTable] = useState(false);

  // Transfer modal
  const [transferSourceTable, setTransferSourceTable] = useState<ITable | null>(null);
  const [targetTableId, setTargetTableId] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Status Change modal
  const [selectedTableForStatus, setSelectedTableForStatus] = useState<ITable | null>(null);

  const fetchTablesAndFloors = async () => {
    setLoading(true);
    try {
      const [tableRes, floorRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/floors"),
      ]);

      if (tableRes.ok) setTables((await tableRes.json()).tables || []);
      if (floorRes.ok) {
        const floorData = (await floorRes.json()).floors || [];
        setFloors(floorData);
        if (floorData.length > 0 && !newTableFloor) {
          setNewTableFloor(floorData[0].name);
        }
      }
    } catch {
      toast.error("টেবিল তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndFloors();
  }, []);

  const filteredTables = tables.filter((t) => {
    if (selectedFloor === "all") return true;
    return t.floor === selectedFloor;
  });

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;

    setSubmittingTable(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: newTableNumber.trim(),
          floor: newTableFloor,
          capacity: newTableCapacity,
          status: "AVAILABLE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "টেবিল তৈরি ব্যর্থ");

      toast.success("নতুন টেবিল সফলভাবে তৈরি হয়েছে");
      setCreateTableOpen(false);
      setNewTableNumber("");
      fetchTablesAndFloors();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingTable(false);
    }
  };

  const handleUpdateStatus = async (status: TableStatus) => {
    if (!selectedTableForStatus) return;

    try {
      const res = await fetch(`/api/tables/${selectedTableForStatus._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("স্ট্যাটাস আপডেট ব্যর্থ");
      toast.success("টেবিল স্ট্যাটাস পরিবর্তন করা হয়েছে");
      setSelectedTableForStatus(null);
      fetchTablesAndFloors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleTransferOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceTable || !targetTableId) {
      toast.error("গন্তব্য টেবিল নির্বাচন করুন");
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch(`/api/tables/${transferSourceTable._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRANSFER",
          targetTableId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "স্থানান্তর ব্যর্থ");

      toast.success(data.message);
      setTransferSourceTable(null);
      setTargetTableId("");
      fetchTablesAndFloors();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">খালি (Available)</Badge>;
      case "OCCUPIED":
        return <Badge variant="danger">ব্যস্ত (Occupied)</Badge>;
      case "RESERVED":
        return <Badge variant="warning">রিজার্ভ (Reserved)</Badge>;
      case "CLEANING":
        return <Badge variant="info">পরিষ্কার হচ্ছে</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              টেবিল ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              রেস্টুরেন্টের ফ্লোর প্ল্যান, সিটিং ক্যাপাসিটি ও টেবিলের রিয়েল-টাইম স্ট্যাটাস
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchTablesAndFloors}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setCreateTableOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> নতুন টেবিল
            </Button>
          </div>
        </div>

        {/* Floor Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFloor("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFloor === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            সব ফ্লোর ({tables.length})
          </button>
          {floors.map((f) => {
            const count = tables.filter((t) => t.floor === f.name).length;
            return (
              <button
                key={f._id}
                onClick={() => setSelectedFloor(f.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFloor === f.name
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.nameBn} ({count})
              </button>
            );
          })}
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">টেবিল লোড হচ্ছে...</div>
        ) : filteredTables.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 space-y-2">
            <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">এই ফ্লোরে কোন টেবিল যোগ করা নেই</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map((table) => {
              const isOccupied = table.status === "OCCUPIED";
              const activeOrder = table.activeOrderId as any;

              return (
                <div
                  key={table._id}
                  className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    table.status === "AVAILABLE"
                      ? "bg-white border-emerald-200 hover:border-emerald-500 shadow-2xs"
                      : table.status === "OCCUPIED"
                      ? "bg-rose-50/50 border-rose-200 shadow-xs"
                      : table.status === "RESERVED"
                      ? "bg-amber-50/50 border-amber-200 shadow-xs"
                      : "bg-sky-50/50 border-sky-200 shadow-xs"
                  }`}
                >
                  {/* Card Top */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {table.tableNumber}
                      </span>
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-mono">{table.capacity}</span>
                      </div>
                    </div>
                    <div className="mt-1">{getStatusBadge(table.status)}</div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{table.floor}</span>

                    {/* Active Order details if occupied */}
                    {isOccupied && activeOrder && (
                      <div className="mt-3 p-2 bg-white/80 rounded-xl border border-rose-100 text-[11px] space-y-0.5">
                        <div className="flex justify-between font-mono font-semibold text-rose-800">
                          <span>{activeOrder.orderNumber}</span>
                          <span>{formatBDT(activeOrder.grandTotal || 0)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          আইটেম: {activeOrder.items?.length || 0} টি
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                    {table.status === "AVAILABLE" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => router.push(`/pos?tableId=${table._id}`)}
                        className="w-full text-xs font-semibold py-1.5"
                      >
                        অর্ডার নিন →
                      </Button>
                    ) : isOccupied ? (
                      <div className="w-full flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTransferSourceTable(table);
                            setTargetTableId("");
                          }}
                          className="flex-1 text-[10px] py-1 gap-1"
                        >
                          <MoveRight className="w-3 h-3" /> শিফট
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedTableForStatus(table)}
                          className="flex-1 text-[10px] py-1"
                        >
                          স্ট্যাটাস
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTableForStatus(table)}
                        className="w-full text-xs py-1"
                      >
                        স্ট্যাটাস বদলান
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Table Modal */}
        <Dialog
          open={createTableOpen}
          onClose={() => setCreateTableOpen(false)}
          title="নতুন টেবিল যোগ করুন"
        >
          <form onSubmit={handleCreateTable} className="space-y-4">
            <Input
              label="টেবিল নম্বর / নাম *"
              placeholder="উদাঃ T-01 বা VIP-1"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ফ্লোর *</label>
              <select
                value={newTableFloor}
                onChange={(e) => setNewTableFloor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                {floors.map((f) => (
                  <option key={f._id} value={f.name}>
                    {f.nameBn} ({f.name})
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              min="1"
              label="আসন সংখ্যা (ধারণক্ষমতা) *"
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateTableOpen(false)}
                disabled={submittingTable}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" loading={submittingTable}>
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Change Status Modal */}
        {selectedTableForStatus && (
          <Dialog
            open={!!selectedTableForStatus}
            onClose={() => setSelectedTableForStatus(null)}
            title={`টেবিল ${selectedTableForStatus.tableNumber} এর অবস্থা নির্ধারণ`}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-500">নতুন স্ট্যাটাস নির্বাচন করুন:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("AVAILABLE")}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  খালি (Available)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("OCCUPIED")}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  ব্যস্ত (Occupied)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("RESERVED")}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  রিজার্ভ (Reserved)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("CLEANING")}
                  className="border-sky-300 text-sky-700 hover:bg-sky-50"
                >
                  পরিষ্কার হচ্ছে (Cleaning)
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* Transfer Order Modal */}
        {transferSourceTable && (
          <Dialog
            open={!!transferSourceTable}
            onClose={() => setTransferSourceTable(null)}
            title={`অর্ডার স্থানান্তর (টেবিল ${transferSourceTable.tableNumber} থেকে)`}
          >
            <form onSubmit={handleTransferOrder} className="space-y-4 text-xs">
              <p className="text-slate-600">
                টেবিল {transferSourceTable.tableNumber}-এর সক্রিয় অর্ডারটি কোন টেবিলে স্থানান্তর করতে চান?
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  গন্তব্য খালি টেবিল নির্বাচন করুন *
                </label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- টেবিল পছন্দ করুন --</option>
                  {tables
                    .filter(
                      (t) =>
                        t._id !== transferSourceTable._id &&
                        (t.status === "AVAILABLE" || t.status === "CLEANING")
                    )
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        টেবিল {t.tableNumber} ({t.floor}) - ধারণক্ষমতা: {t.capacity}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransferSourceTable(null)}
                  disabled={transferring}
                >
                  বাতিল
                </Button>
                <Button type="submit" variant="primary" loading={transferring}>
                  স্থানান্তর সম্পন্ন করুন
                </Button>
              </div>
            </form>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
