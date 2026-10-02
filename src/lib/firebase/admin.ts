import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

interface FirebaseAdminConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

const config: FirebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
};

export function getFirebaseAdminApp(): App | null {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }

  if (config.projectId && config.clientEmail && config.privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
    } catch (err) {
      console.error("[Firebase Admin] Initialization error:", err);
      return null;
    }
  }

  // If credentials are incomplete in local development
  return null;
}

/**
 * Server-side Firebase ID token verification.
 * In production or when credentials exist, strictly verifies the token.
 * In development mode with local credentials unset, accepts mock token "dev-token-<firebaseUid>"
 * to allow seamless local testing of the full software suite.
 */
export async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  if (!token) return null;

  // Local development / testing bypass for mock dev tokens
  if (process.env.NODE_ENV !== "production" && token.startsWith("dev-token-")) {
    const uid = token.replace("dev-token-", "");
    return { uid, email: `${uid}@swadrestaurant.com` };
  }

  const app = getFirebaseAdminApp();

  if (app) {
    try {
      const decoded = await getAuth(app).verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
      };
    } catch (error) {
      console.error("[Firebase Admin] Token verification failed:", error);
      return null;
    }
  }

  return null;
}
