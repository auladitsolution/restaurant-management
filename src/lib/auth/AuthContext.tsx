"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInAnonymously,
  linkWithPopup,
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
  isAnonymous: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  linkWithGoogle: () => Promise<void>;
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
          return data.user;
        } else {
          setUser(null);
          throw new Error(data.message || "ব্যবহারকারী অ্যাকাউন্টটি সক্রিয় নয়");
        }
      } else {
        setUser(null);
        throw new Error("সার্ভারে লগইন ভেরিফিকেশন ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error("Failed to sync user session:", err);
      setUser(null);
      throw err;
    }
  };

  useEffect(() => {
    const isExplicitlyLoggedOut =
      typeof window !== "undefined" && localStorage.getItem("pos_logged_out") === "true";

    const devToken =
      typeof window !== "undefined" ? localStorage.getItem("pos_dev_token") : null;

    if (isExplicitlyLoggedOut) {
      setLoading(false);
      setUser(null);
      setIdToken(null);
      setFirebaseUser(null);
    } else if (devToken && process.env.NODE_ENV !== "production") {
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
    }

    // Handle redirect login results (if user was redirected from Google auth)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const fbUser = result.user;
          setFirebaseUser(fbUser);
          const token = await fbUser.getIdToken(true);
          setIdToken(token);
          document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
          await syncUserWithBackend(token);
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err);
      });

    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      const activeDevToken =
        typeof window !== "undefined" ? localStorage.getItem("pos_dev_token") : null;
      if (activeDevToken && process.env.NODE_ENV !== "production") {
        return;
      }

      const isLoggedOut =
        typeof window !== "undefined" && localStorage.getItem("pos_logged_out") === "true";
      if (isLoggedOut || !fbUser) {
        setFirebaseUser(null);
        setUser(null);
        setIdToken(null);
        document.cookie = "auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setLoading(false);
        return;
      }

      setFirebaseUser(fbUser);
      try {
        const token = await fbUser.getIdToken();
        setIdToken(token);
        document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
        await syncUserWithBackend(token);
      } catch (e) {
        console.error("Firebase auth token refresh error:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_logged_out");
        localStorage.removeItem("pos_dev_token");
      }
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setFirebaseUser(fbUser);
      const token = await fbUser.getIdToken(true);
      setIdToken(token);
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
      await syncUserWithBackend(token);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleRedirect = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_logged_out");
        localStorage.removeItem("pos_dev_token");
      }
      await signInWithRedirect(auth, googleProvider);
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
        localStorage.removeItem("pos_dev_token");
      }
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = result.user;
      setFirebaseUser(fbUser);
      const token = await fbUser.getIdToken(true);
      setIdToken(token);
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
      await syncUserWithBackend(token);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymously = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_logged_out");
        localStorage.removeItem("pos_dev_token");
      }
      const result = await signInAnonymously(auth);
      const fbUser = result.user;
      setFirebaseUser(fbUser);
      const token = await fbUser.getIdToken(true);
      setIdToken(token);
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
      await syncUserWithBackend(token);
    } catch (err: any) {
      setLoading(false);
      if (
        err?.code === "auth/admin-restricted-operation" ||
        err?.code === "auth/operation-not-allowed"
      ) {
        const enhancedError: any = new Error(
          "Firebase Console-এ Anonymous Authentication এনেবল (Enable) করা নেই।"
        );
        enhancedError.code = err.code;
        throw enhancedError;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const linkWithGoogle = async () => {
    if (!auth.currentUser) throw new Error("কোনো সক্রিয় অ্যাকাউন্ট পাওয়া যায়নি");
    setLoading(true);
    try {
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      const fbUser = result.user;
      setFirebaseUser(fbUser);
      const token = await fbUser.getIdToken(true);
      setIdToken(token);
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
      await syncUserWithBackend(token);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
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
        isAnonymous: Boolean(firebaseUser?.isAnonymous || user?.isAnonymous),
        loginWithGoogle,
        loginWithGoogleRedirect,
        loginWithEmail,
        loginAnonymously,
        linkWithGoogle,
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
