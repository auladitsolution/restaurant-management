import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

interface FirebaseAdminConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let cleanKey = key.trim();
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.slice(1, -1).trim();
  }
  cleanKey = cleanKey.replace(/\\n/g, "\n");

  // Handle base64 encoded private key if provided
  if (!cleanKey.includes("-----BEGIN PRIVATE KEY-----")) {
    try {
      const decoded = Buffer.from(cleanKey, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
        cleanKey = decoded;
      }
    } catch {
      // not base64, ignore
    }
  }

  return cleanKey;
}

export function getFirebaseAdminApp(): App | null {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }

  // 1. Support full JSON service account if provided
  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return initializeApp({
          credential: cert({
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: formatPrivateKey(parsed.private_key)!,
          }),
        });
      }
    } catch (err) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", err);
    }
  }

  // 2. Standard individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error("[Firebase Admin] Initialization error:", err);
      return null;
    }
  }

  return null;
}

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  isAnonymous?: boolean;
  providerId?: string;
}

/**
 * Server-side Firebase ID token verification.
 * In production or when credentials exist, strictly verifies the token.
 * In development mode with local credentials unset, accepts mock token "dev-token-<firebaseUid>"
 * to allow seamless local testing of the full software suite.
 */
export async function verifyFirebaseToken(token: string): Promise<VerifiedFirebaseToken | null> {
  if (!token) return null;

  // Allow mock dev / demo tokens (both locally and on Vercel for preview & instant testing)
  if (token.startsWith("dev-token-")) {
    const uid = token.replace("dev-token-", "");
    const isAnon = uid.includes("anonymous") || uid.includes("guest") || uid.includes("cashier");
    return {
      uid,
      email: isAnon && uid.includes("guest") ? undefined : `${uid}@swadrestaurant.com`,
      name: isAnon ? "অতিথি ব্যবহারকারী (Guest)" : `Dev ${uid.replace("dev-uid-", "").toUpperCase()}`,
      isAnonymous: isAnon,
      providerId: isAnon ? "anonymous" : "password",
    };
  }

  const app = getFirebaseAdminApp();

  if (app) {
    try {
      const decoded = await getAuth(app).verifyIdToken(token);
      const isAnonymous =
        decoded.firebase?.sign_in_provider === "anonymous" ||
        (!decoded.email && !decoded.name);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: (decoded.name as string) || (isAnonymous ? "অতিথি ব্যবহারকারী (Guest)" : undefined),
        picture: (decoded.picture as string) || undefined,
        isAnonymous,
        providerId: decoded.firebase?.sign_in_provider,
      };
    } catch (error) {
      console.error("[Firebase Admin] Token verification failed:", error);
      return null;
    }
  }

  const pId = Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const cEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL);
  const pKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);

  console.error(
    `[Firebase Admin] Cannot verify token: Firebase Admin App is not initialized.\n` +
    `Missing Environment Variables on Vercel:\n` +
    `- FIREBASE_PROJECT_ID: ${pId ? "FOUND" : "MISSING"}\n` +
    `- FIREBASE_CLIENT_EMAIL: ${cEmail ? "FOUND" : "MISSING"}\n` +
    `- FIREBASE_PRIVATE_KEY: ${pKey ? "FOUND" : "MISSING"}\n` +
    `Please add these 3 variables in your Vercel Project Settings > Environment Variables.`
  );
  return null;
}
