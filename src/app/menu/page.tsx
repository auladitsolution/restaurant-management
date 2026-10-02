"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ICategory, IMenuItem, IMenuItemVariant, IMenuItemAddOn } from "@/types";
import { formatBDT } from "@/lib/calculations/financial";
import { toast } from "sonner";
import {
  MenuSquare,
  Plus,
  Edit,
  Trash2,
  Upload,
  Check,
  X,
  Search,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catNameBn, setCatNameBn] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [catSortOrder, setCatSortOrder] = useState(0);

  // Menu Item Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [itemNameBn, setItemNameBn] = useState("");
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemCatId, setItemCatId] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemBasePrice, setItemBasePrice] = useState<number>(0);
  const [itemCostPrice, setItemCostPrice] = useState<number>(0);
  const [itemImage, setItemImage] = useState("");
  const [itemAvailability, setItemAvailability] = useState(true);

  // Variants & AddOns in Modal
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<IMenuItemVariant[]>([]);
  const [addOns, setAddOns] = useState<IMenuItemAddOn[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/menu"),
      ]);

      if (catRes.ok) setCategories((await catRes.json()).categories || []);
      if (itemRes.ok) setMenuItems((await itemRes.json()).items || []);
    } catch {
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameBn || !catNameEn) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: catNameBn.trim(),
          nameEn: catNameEn.trim(),
          sortOrder: catSortOrder,
        }),
      });

      if (!res.ok) throw new Error("ক্যাটাগরি তৈরি ব্যর্থ হয়েছে");
      toast.success("ক্যাটাগরি তৈরি হয়েছে");
      setCatModalOpen(false);
      setCatNameBn("");
      setCatNameEn("");
      fetchMenuData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "menu");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ছবি আপলোড ব্যর্থ");
      setItemImage(data.url);
      toast.success("ছবি সফলভাবে আপলোড হয়েছে!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemNameBn("");
    setItemNameEn("");
    setItemCatId(categories[0]?._id || "");
    setItemDesc("");
    setItemBasePrice(0);
    setItemCostPrice(0);
    setItemImage("");
    setItemAvailability(true);
    setHasVariants(false);
    setVariants([]);
    setAddOns([]);
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: IMenuItem) => {
    setEditingItem(item);
    setItemNameBn(item.nameBn);
    setItemNameEn(item.nameEn);
    setItemCatId(item.categoryId);
    setItemDesc(item.description || "");
    setItemBasePrice(item.basePrice);
    setItemCostPrice(item.costPrice || 0);
    setItemImage(item.image || "");
    setItemAvailability(item.availability);
    setHasVariants(item.hasVariants);
    setVariants(item.variants || []);
    setAddOns(item.addOns || []);
    setItemModalOpen(true);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameBn || !itemNameEn || !itemCatId) {
      toast.error("প্রয়োজনীয় ঘরগুলো পূরণ করুন");
      return;
    }

    const payload = {
      nameBn: itemNameBn.trim(),
      nameEn: itemNameEn.trim(),
      categoryId: itemCatId,
      description: itemDesc.trim(),
      basePrice: itemBasePrice,
      costPrice: itemCostPrice,
      image: itemImage,
      availability: itemAvailability,
      hasVariants,
      variants,
      addOns,
    };

    try {
      const url = editingItem ? `/api/menu/${editingItem._id}` : "/api/menu";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "সংরক্ষণ ব্যর্থ");

      toast.success(
        editingItem ? "মেনু আইটেম আপডেট সম্পন্ন হয়েছে" : "মেনু আইটেম যোগ হয়েছে"
      );
      setItemModalOpen(false);
      fetchMenuData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleAvailability = async (item: IMenuItem) => {
    try {
      const res = await fetch(`/api/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: !item.availability }),
      });
      if (res.ok) {
        toast.success(
          !item.availability ? `${item.nameBn} উপলব্ধ করা হয়েছে` : `${item.nameBn} স্টক-আউট করা হয়েছে`
        );
        fetchMenuData();
      }
    } catch {
      toast.error("আপডেট ব্যর্থ");
    }
  };

  const filteredItems = menuItems.filter((m) => {
    const matchesCat = selectedCat === "all" || m.categoryId === selectedCat;
    const matchesSearch =
      !search ||
      m.nameBn.toLowerCase().includes(search.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">মেনু ব্যবস্থাপনা</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ক্যাটাগরি, মূল্য, ভ্যারিয়েন্ট, ছবি এবং মেনু আইটেম সমন্বয়
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCatModalOpen(true)}
              className="gap-1.5"
            >
              + ক্যাটাগরি যোগ
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={openCreateItemModal}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> নতুন মেনু আইটেম
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCat === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            সব আইটেম ({menuItems.length})
          </button>
          {categories.map((c) => {
            const count = menuItems.filter((m) => m.categoryId === c._id).length;
            return (
              <button
                key={c._id}
                onClick={() => setSelectedCat(c._id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCat === c._id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {c.nameBn} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">ছবি</th>
                  <th className="p-3">আইটেমের নাম (বাংলা ও ইংরেজি)</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3 text-right">বিক্রয় মূল্য</th>
                  <th className="p-3 text-right">খরচ / প্রস্তুত রেট</th>
                  <th className="p-3 text-center">উপলব্ধতা</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      মেনু লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      কোন মেনু আইটেম পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60">
                      <td className="p-3 w-14">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.nameBn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                              POS
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.nameBn}</div>
                        <div className="text-[11px] text-slate-400">{item.nameEn}</div>
                        {item.hasVariants && (
                          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
                            {item.variants?.length} টি ভ্যারিয়েন্ট
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        {item.categoryName || "সাধারণ"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {formatBDT(item.basePrice)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {formatBDT(item.costPrice || 0)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            item.availability
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {item.availability ? "✓ উপলব্ধ" : "✕ শেষ (Out)"}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditItemModal(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Category Modal */}
        <Dialog
          open={catModalOpen}
          onClose={() => setCatModalOpen(false)}
          title="নতুন মেনু ক্যাটাগরি তৈরি"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <Input
              label="ক্যাটাগরির বাংলা নাম *"
              placeholder="উদাঃ বিরিয়ানি বা বার্গার"
              value={catNameBn}
              onChange={(e) => setCatNameBn(e.target.value)}
              required
            />
            <Input
              label="ক্যাটাগরির ইংরেজি নাম *"
              placeholder="Biryani or Burger"
              value={catNameEn}
              onChange={(e) => setCatNameEn(e.target.value)}
              required
            />
            <Input
              type="number"
              label="সিরিয়াল নম্বর (Sort Order)"
              value={catSortOrder}
              onChange={(e) => setCatSortOrder(parseInt(e.target.value) || 0)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCatModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary">
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Menu Item Modal */}
        <Dialog
          open={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          title={editingItem ? "মেনু আইটেম সম্পাদন" : "নতুন মেনু আইটেম তৈরি"}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="বাংলা নাম *"
                placeholder="উদাঃ চিকেন বিরিয়ানি"
                value={itemNameBn}
                onChange={(e) => setItemNameBn(e.target.value)}
                required
              />
              <Input
                label="ইংরেজি নাম *"
                placeholder="Chicken Biryani"
                value={itemNameEn}
                onChange={(e) => setItemNameEn(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
                <select
                  value={itemCatId}
                  onChange={(e) => setItemCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- পছন্দ করুন --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="number"
                min="0"
                step="any"
                label="বিক্রয় মূল্য (৳) *"
                value={itemBasePrice}
                onChange={(e) => setItemBasePrice(parseFloat(e.target.value) || 0)}
                required
              />

              <Input
                type="number"
                min="0"
                step="any"
                label="প্রস্তুত/ক্রয় খরচ (৳) *"
                value={itemCostPrice}
                onChange={(e) => setItemCostPrice(parseFloat(e.target.value) || 0)}
                helperText="লাভ গণনায় ব্যবহৃত হয়"
              />
            </div>

            {/* Cloudinary Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আইটেমের ছবি (Cloudinary)
              </label>
              <div className="flex items-center gap-3">
                {itemImage && (
                  <img
                    src={itemImage}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border"
                  />
                )}
                <label className="cursor-pointer px-3 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 text-xs font-medium">
                  <Upload className="w-4 h-4 text-slate-500" />
                  {uploadingImage ? "আপলোড হচ্ছে..." : "ছবি নির্বাচন করুন"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                {itemImage && (
                  <button
                    type="button"
                    onClick={() => setItemImage("")}
                    className="text-rose-500 hover:text-rose-700 text-xs"
                  >
                    ছবি বাতিল
                  </button>
                )}
              </div>
            </div>

            {/* Variants Toggle */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => {
                    setHasVariants(e.target.checked);
                    if (e.target.checked && variants.length === 0) {
                      setVariants([
                        { nameBn: "স্মল (Small)", nameEn: "Small", price: itemBasePrice, costPrice: itemCostPrice },
                        { nameBn: "লার্জ (Large)", nameEn: "Large", price: itemBasePrice * 1.5, costPrice: itemCostPrice * 1.5 },
                      ]);
                    }
                  }}
                  className="rounded-sm text-emerald-600"
                />
                <span>এই আইটেমের সাইজ / ভ্যারিয়েন্ট আছে (Small, Medium, Large)</span>
              </label>

              {hasVariants && (
                <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-xl">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="ভ্যারিয়েন্ট নাম"
                        value={v.nameBn}
                        onChange={(e) => {
                          const copy = [...variants];
                          copy[i].nameBn = e.target.value;
                          setVariants(copy);
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder="মূল্য"
                        value={v.price}
                        onChange={(e) => {
                          const copy = [...variants];
                          copy[i].price = parseFloat(e.target.value) || 0;
                          setVariants(copy);
                        }}
                        className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setVariants([
                        ...variants,
                        { nameBn: "নতুন সাইজ", nameEn: "New Size", price: itemBasePrice, costPrice: itemCostPrice },
                      ])
                    }
                    className="text-xs"
                  >
                    + ভ্যারিয়েন্ট যোগ
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setItemModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary">
                সংরক্ষণ সম্পন্ন করুন
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
