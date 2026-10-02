import { Permission, UserRole, IUser } from "@/types";

/**
 * Standard permissions assigned by default to each role.
 * Additional custom permissions can also be granted on a per-user basis.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    "dashboard:view",
    "pos:access",
    "orders:create",
    "orders:read",
    "orders:update",
    "orders:cancel",
    "tables:manage",
    "kitchen:access",
    "menu:manage",
    "inventory:manage",
    "purchases:manage",
    "expenses:manage",
    "customers:manage",
    "shifts:manage",
    "reports:view",
    "reports:profit",
    "users:manage",
    "settings:manage",
    "audit:view",
    "backup:export",
  ],
  MANAGER: [
    "dashboard:view",
    "pos:access",
    "orders:create",
    "orders:read",
    "orders:update",
    "orders:cancel",
    "tables:manage",
    "kitchen:access",
    "menu:manage",
    "inventory:manage",
    "purchases:manage",
    "expenses:manage",
    "customers:manage",
    "shifts:manage",
    "reports:view",
    "audit:view",
  ],
  CASHIER: [
    "dashboard:view",
    "pos:access",
    "orders:create",
    "orders:read",
    "orders:update",
    "customers:manage",
    "shifts:manage",
  ],
  WAITER: [
    "pos:access",
    "orders:create",
    "orders:read",
    "orders:update",
    "tables:manage",
  ],
  KITCHEN: [
    "kitchen:access",
    "orders:read",
  ],
  INVENTORY_MANAGER: [
    "inventory:manage",
    "purchases:manage",
    "reports:view",
  ],
};

export const ROLE_NAMES_BN: Record<UserRole, string> = {
  OWNER: "মালিক / সুপার এডমিন",
  MANAGER: "ম্যানেজার",
  CASHIER: "ক্যাশিয়ার",
  WAITER: "ওয়েটার",
  KITCHEN: "কিচেন স্টাফ",
  INVENTORY_MANAGER: "ইনভেন্টরি ম্যানেজার",
};

export const PERMISSION_NAMES_BN: Record<Permission, string> = {
  "dashboard:view": "ড্যাশবোর্ড দর্শন",
  "pos:access": "POS ব্যবহার",
  "orders:create": "নতুন অর্ডার তৈরি",
  "orders:read": "অর্ডার দেখা",
  "orders:update": "অর্ডার আপডেট ও পেমেন্ট",
  "orders:cancel": "অর্ডার বাতিল ও রিফান্ড",
  "tables:manage": "টেবিল ম্যানেজমেন্ট",
  "kitchen:access": "কিচেন ডিসপ্লে (KDS)",
  "menu:manage": "মেনু ও ক্যাটাগরি ব্যবস্থাপনা",
  "inventory:manage": "ইনভেন্টরি ও স্টক ব্যবস্থাপনা",
  "purchases:manage": "সাপ্লায়ার ক্রয় ব্যবস্থাপনা",
  "expenses:manage": "খরচ হিসাব ব্যবস্থাপনা",
  "customers:manage": "কাস্টমার ব্যবস্থাপনা",
  "shifts:manage": "ক্যাশ শিফট ও রেজিস্টার",
  "reports:view": "সাধারণ রিপোর্ট দর্শন",
  "reports:profit": "লাভ-ক্ষতির বিস্তারিত রিপোর্ট",
  "users:manage": "ব্যবহারকারী ও কর্মী ব্যবস্থাপনা",
  "settings:manage": "রেস্টুরেন্ট সেটিংস পরিবর্তন",
  "audit:view": "নিরাপত্তা ও অডিট লগ দেখা",
  "backup:export": "ডাটা ব্যাকআপ ও এক্সপোর্ট",
};

/**
 * Checks if a user has a specific permission.
 * Owners always have all permissions.
 * Other roles check either their default role permissions or explicitly granted permissions.
 */
export function hasPermission(
  user: Pick<IUser, "role" | "permissions" | "active"> | null | undefined,
  requiredPermission: Permission
): boolean {
  if (!user || !user.active) {
    return false;
  }

  // Owner has absolute access
  if (user.role === "OWNER") {
    return true;
  }

  // Check custom individual permissions
  if (user.permissions && user.permissions.includes(requiredPermission)) {
    return true;
  }

  // Check default role permissions
  const defaultRolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return defaultRolePermissions.includes(requiredPermission);
}

/**
 * Checks if a user has any of the specified roles
 */
export function hasRole(
  user: Pick<IUser, "role" | "active"> | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!user || !user.active) return false;
  return allowedRoles.includes(user.role);
}
