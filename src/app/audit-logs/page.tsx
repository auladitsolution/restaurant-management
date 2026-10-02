"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IAuditLog } from "@/types";
import { toast } from "sonner";
import { ShieldCheck, RefreshCw, Eye } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      toast.error("অডিট লগ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">নিরাপত্তা ও অডিট লগ</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                গুরুত্বপূর্ণ আর্থিক, মূল্য পরিবর্তন, অর্ডার বাতিল ও ব্যবহারকারী কার্যক্রমের স্থায়ী ট্র্যাক
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
          </Button>
        </div>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">তারিখ ও সময়</th>
                  <th className="p-3">ব্যবহারকারী</th>
                  <th className="p-3">ভূমিকা (Role)</th>
                  <th className="p-3">অ্যাকশন / ঘটনা</th>
                  <th className="p-3">মডিউল / এনটিটি</th>
                  <th className="p-3 text-center">স্ন্যাপশট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      লগ লোড হচ্ছে...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      কোন অডিট লগ রেকর্ড নেই
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-GB")}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{log.userName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{log.action}</td>
                      <td className="p-3 text-slate-600 font-medium">{log.entityType}</td>
                      <td className="p-3 text-center">
                        {(log.beforeSnapshot || log.afterSnapshot || log.metadata) && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* View Snapshot Dialog */}
        {selectedLog && (
          <Dialog
            open={!!selectedLog}
            onClose={() => setSelectedLog(null)}
            title={`অডিট রেকর্ড বিস্তারিত: ${selectedLog.action}`}
            maxWidth="lg"
          >
            <div className="space-y-4 text-xs font-mono">
              {selectedLog.beforeSnapshot && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">পূর্ববর্তী অবস্থা (Before):</h4>
                  <pre className="p-3 bg-slate-100 rounded-xl overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedLog.beforeSnapshot, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterSnapshot && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">পরবর্তী অবস্থা (After):</h4>
                  <pre className="p-3 bg-slate-100 rounded-xl overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedLog.afterSnapshot, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">মেটাডেটা:</h4>
                  <pre className="p-3 bg-slate-100 rounded-xl overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
