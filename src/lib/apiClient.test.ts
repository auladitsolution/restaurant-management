import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isDemoMode, fetchData, fetchWithDemo, apiClient } from "./apiClient";

describe("Conditional Data Fetching Engine (apiClient)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_DEMO_MODE;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = originalEnv;
  });

  describe("isDemoMode()", () => {
    it("returns true when NEXT_PUBLIC_DEMO_MODE is 'true' (case-insensitive)", () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "true";
      expect(isDemoMode()).toBe(true);

      process.env.NEXT_PUBLIC_DEMO_MODE = "True";
      expect(isDemoMode()).toBe(true);

      process.env.NEXT_PUBLIC_DEMO_MODE = "TRUE";
      expect(isDemoMode()).toBe(true);
    });

    it("returns true when NEXT_PUBLIC_DEMO_MODE is '1'", () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "1";
      expect(isDemoMode()).toBe(true);
    });

    it("returns false when NEXT_PUBLIC_DEMO_MODE is 'false'", () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "false";
      expect(isDemoMode()).toBe(false);
    });

    it("returns false when NEXT_PUBLIC_DEMO_MODE is undefined or empty string", () => {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
      expect(isDemoMode()).toBe(false);

      process.env.NEXT_PUBLIC_DEMO_MODE = "";
      expect(isDemoMode()).toBe(false);
    });
  });

  describe("fetchData() in DEMO MODE (NEXT_PUBLIC_DEMO_MODE=true)", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    });

    it("returns endpoint mock data without calling window.fetch", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await fetchData("/api/settings", { mockDelayMs: 0 });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.data.nameBn).toBe("স্বাদ রেস্টুরেন্ট অ্যান্ড ক্যাফে");
      expect(result.data.currency).toBe("BDT");
    });

    it("returns categories mock data for /api/categories", async () => {
      const result = await fetchData("/api/categories", { mockDelayMs: 0 });
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].nameBn).toBe("বিরিয়ানি ও রাইস");
    });

    it("returns menu items mock data for /api/menu", async () => {
      const result = await fetchData("/api/menu", { mockDelayMs: 0 });
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data[0].nameBn).toContain("কাচ্চি বিরিয়ানি");
    });

    it("returns dashboard reports mock data for /api/reports?range=today", async () => {
      const result = await fetchData("/api/reports?range=today", { mockDelayMs: 0 });
      expect(result.kpis).toBeDefined();
      expect(result.kpis.totalSales).toBe(48650);
      expect(result.charts.topSellingItems.length).toBeGreaterThan(0);
    });

    it("allows custom inline mock data override", async () => {
      const customMock = { custom: "food", count: 99 };
      const result = await fetchData("/api/any-endpoint", { mockDelayMs: 0, mockData: customMock });

      expect(result).toEqual(customMock);
    });

    it("supports functional mock data generators", async () => {
      const result = await fetchData("/api/dynamic", {
        mockDelayMs: 0,
        mockData: () => ({ timestamp: 12345 }),
      });

      expect(result).toEqual({ timestamp: 12345 });
    });
  });

  describe("fetchData() in LIVE MODE (NEXT_PUBLIC_DEMO_MODE=false)", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    });

    it("fetches data from the live API via fetch()", async () => {
      const fakeApiResponse = { success: true, live: "live-data" };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(fakeApiResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await fetchData("/api/menu");

      expect(fetchSpy).toHaveBeenCalledWith("/api/menu", undefined);
      expect(result).toEqual(fakeApiResponse);
    });

    it("throws informative error when HTTP request fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "অননুমোদিত রিকোয়েস্ট (Unauthorized)" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(fetchData("/api/secret")).rejects.toThrow("অননুমোদিত রিকোয়েস্ট (Unauthorized)");
    });
  });

  describe("fetchWithDemo() drop-in Response fetcher", () => {
    it("returns standard Response object with ok=true and status=200 in demo mode", async () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "true";
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const response = await fetchWithDemo("/api/tables", { mockDelayMs: 0 });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(response).toBeInstanceOf(Response);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-Demo-Mode")).toBe("true");

      const json = await response.json();
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThan(0);
    });

    it("delegates to native fetch when demo mode is false", async () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "false";
      const fakeResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(fakeResponse);

      const response = await fetchWithDemo("/api/tables");

      expect(fetchSpy).toHaveBeenCalledWith("/api/tables", undefined);
      expect(response).toBe(fakeResponse);
    });
  });

  describe("apiClient HTTP method helpers", () => {
    it("calls get, post, put, delete correctly", async () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = "true";

      const getRes = await apiClient.get("/api/settings", { mockDelayMs: 0 });
      expect(getRes.success).toBe(true);

      const postRes = await apiClient.post("/api/orders", { items: [] }, { mockDelayMs: 0 });
      expect(postRes.success).toBe(true);

      const putRes = await apiClient.put("/api/settings", { vatRate: 5 }, { mockDelayMs: 0 });
      expect(putRes.success).toBe(true);

      const delRes = await apiClient.delete("/api/categories/1", { mockDelayMs: 0 });
      expect(delRes.success).toBe(true);
    });
  });
});
