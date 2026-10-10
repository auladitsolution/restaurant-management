import { describe, it, expect } from "vitest";
import { hasPermission, hasRole } from "./rbac";
import { IUser } from "@/types";

describe("RBAC Permissions and Roles", () => {
  const activeOwner: IUser = {
    _id: "1",
    firebaseUid: "uid-1",
    name: "Owner User",
    email: "owner@test.com",
    role: "OWNER",
    permissions: [],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const cashier: IUser = {
    _id: "2",
    firebaseUid: "uid-2",
    name: "Cashier User",
    email: "cashier@test.com",
    role: "CASHIER",
    permissions: [],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const cashierWithBonusPermission: IUser = {
    _id: "3",
    firebaseUid: "uid-3",
    name: "Senior Cashier",
    email: "senior@test.com",
    role: "CASHIER",
    permissions: ["reports:view"],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const inactiveUser: IUser = {
    _id: "4",
    firebaseUid: "uid-4",
    name: "Inactive User",
    email: "inactive@test.com",
    role: "MANAGER",
    permissions: [],
    active: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("grants OWNER full access to any permission", () => {
    expect(hasPermission(activeOwner, "settings:manage")).toBe(true);
    expect(hasPermission(activeOwner, "reports:profit")).toBe(true);
    expect(hasPermission(activeOwner, "users:manage")).toBe(true);
  });

  it("restricts CASHIER from sensitive permissions", () => {
    expect(hasPermission(cashier, "pos:access")).toBe(true);
    expect(hasPermission(cashier, "orders:create")).toBe(true);
    expect(hasPermission(cashier, "settings:manage")).toBe(false);
    expect(hasPermission(cashier, "reports:profit")).toBe(false);
    expect(hasPermission(cashier, "users:manage")).toBe(false);
  });

  it("respects individual custom permissions", () => {
    expect(hasPermission(cashierWithBonusPermission, "reports:view")).toBe(true);
    expect(hasPermission(cashierWithBonusPermission, "reports:profit")).toBe(false);
  });

  it("denies all permissions to inactive users", () => {
    expect(hasPermission(inactiveUser, "dashboard:view")).toBe(false);
    expect(hasPermission(inactiveUser, "pos:access")).toBe(false);
    expect(hasRole(inactiveUser, ["MANAGER"])).toBe(false);
  });

  it("handles anonymous guest users properly", () => {
    const guestUser: IUser = {
      _id: "guest-id",
      firebaseUid: "guest-uid",
      name: "অতিথি ব্যবহারকারী (Guest)",
      email: "guest-uid@anonymous.local",
      role: "CASHIER",
      permissions: [],
      isAnonymous: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(guestUser.isAnonymous).toBe(true);
    expect(hasPermission(guestUser, "pos:access")).toBe(true);
    expect(hasPermission(guestUser, "orders:create")).toBe(true);
    expect(hasPermission(guestUser, "settings:manage")).toBe(false);
    expect(hasRole(guestUser, ["CASHIER"])).toBe(true);
    expect(hasRole(guestUser, ["OWNER"])).toBe(false);
  });
});
