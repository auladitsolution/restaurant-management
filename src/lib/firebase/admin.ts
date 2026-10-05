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
  return cleanKey.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): App | null {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }

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

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[Firebase Admin] Incomplete credentials in production: projectId=${Boolean(projectId)}, clientEmail=${Boolean(clientEmail)}, privateKey=${Boolean(privateKey)}`
    );
  }

  return null;
}

/**
 * Server-side Firebase ID token verification.
 * In production or when credentials exist, strictly verifies the token.
 * In development mode with local credentials unset, accepts mock token "dev-token-<firebaseUid>"
 * to allow seamless local testing of the full software suite.
 */
export async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string; name?: string; picture?: string } | null> {
  if (!token) return null;

  // Local development / testing bypass for mock dev tokens
  if (process.env.NODE_ENV !== "production" && token.startsWith("dev-token-")) {
    const uid = token.replace("dev-token-", "");
    return { uid, email: `${uid}@swadrestaurant.com`, name: `Dev ${uid.replace("dev-uid-", "").toUpperCase()}` };
  }

  const app = getFirebaseAdminApp();

  if (app) {
    try {
      const decoded = await getAuth(app).verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: (decoded.name as string) || undefined,
        picture: (decoded.picture as string) || undefined,
      };
    } catch (error) {
      console.error("[Firebase Admin] Token verification failed:", error);
      return null;
    }
  }

  console.error(
    "[Firebase Admin] Cannot verify token: Firebase Admin App is not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
  );
  return null;
}
