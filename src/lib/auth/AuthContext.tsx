"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { IUser, Permission, UserRole } from "@/types";
import { hasPermission as checkPermission, hasRole as checkRole } from "@/lib/permissions/rbac";

interface AuthContextType {
  user: IUser | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  devLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync token and DB user
  const syncUserWithBackend = async (token: string) => {
    try {
      const res = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to sync user session:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    const isExplicitlyLoggedOut =
      typeof window !== "undefined" && localStorage.getItem("pos_logged_out") === "true";

    // Check if dev token was stored
    let devToken = typeof window !== "undefined" ? localStorage.getItem("pos_dev_token") : null;

    if (isExplicitlyLoggedOut) {
      // User explicitly clicked logout - do not auto-login
      setLoading(false);
      setUser(null);
      setIdToken(null);
      setFirebaseUser(null);
      return;
    }

    // In local development, auto-provision an active OWNER session if not logged in
    if (!devToken && process.env.NODE_ENV !== "production") {
      devToken = "dev-token-dev-uid-owner";
      localStorage.setItem("pos_dev_token", devToken);
      document.cookie = `auth-token=${devToken}; path=/; max-age=86400; SameSite=Lax`;
    }

    if (devToken && process.env.NODE_ENV !== "production") {
      setIdToken(devToken);
      const roleStr = devToken.replace("dev-token-dev-uid-", "").toUpperCase();
      const initialRole = (roleStr || "OWNER") as UserRole;
      setUser({
        _id: "dev-user-id",
        firebaseUid: `dev-uid-${initialRole.toLowerCase()}`,
        name: `Dev ${initialRole}`,
        email: `${initialRole.toLowerCase()}@swadrestaurant.com`,
        phone: "01711000000",
        role: initialRole,
        permissions: [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      syncUserWithBackend(devToken).finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setIdToken(token);
        // Set cookie for Next.js SSR / API routes
        document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
        await syncUserWithBackend(token);
      } else {
        setIdToken(null);
        setUser(null);
        document.cookie = `auth-token=; path=/; max-age=0`;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_logged_out");
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_logged_out");
      }
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_logged_out", "true");
      localStorage.removeItem("pos_dev_token");
      document.cookie = "auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore
    }
    setFirebaseUser(null);
    setUser(null);
    setIdToken(null);
    setLoading(false);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const devLogin = async (role: UserRole) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pos_logged_out");
    }
    const fakeUid = `dev-uid-${role.toLowerCase()}`;
    const token = `dev-token-${fakeUid}`;
    localStorage.setItem("pos_dev_token", token);
    document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
    setIdToken(token);
    setUser({
      _id: "dev-user-id",
      firebaseUid: fakeUid,
      name: `Dev ${role}`,
      email: `${role.toLowerCase()}@swadrestaurant.com`,
      phone: "01711000000",
      role: role,
      permissions: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setLoading(true);
    await syncUserWithBackend(token);
    setLoading(false);
  };

  const hasPerm = (permission: Permission) => {
    return checkPermission(user, permission);
  };

  const hasR = (roles: UserRole[]) => {
    return checkRole(user, roles);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        idToken,
        loading,
        loginWithGoogle,
        loginWithEmail,
        logout,
        hasPermission: hasPerm,
        hasRole: hasR,
        devLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
