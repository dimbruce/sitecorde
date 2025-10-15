
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAwwIHdCaQC-j5UY_iWtifvMyDV18vS4-w",
  authDomain: "sitecord-c9a0d.firebaseapp.com",
  projectId: "sitecord-c9a0d",
  storageBucket: "sitecord-c9a0d.firebasestorage.app",
  messagingSenderId: "1083375226734",
  appId: "1:1083375226734:web:824417803dd2375e83bb7f",
  measurementId: "G-N7X0YM0DXD",
};

// Initialize once (important in dev with HMR)
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Core services
export const db = firebase.firestore();

// A memoized promise to ensure auth is initialized only once.
let authPromise: Promise<firebase.auth.Auth> | null = null;

/**
 * Checks if session storage is available and writable.
 * @returns {boolean} True if session storage is available.
 */
function isSessionStorageAvailable(): boolean {
  try {
    const testKey = 'firebase-session-storage-test';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Gets the initialized Firebase Auth instance.
 * This function is the single entry point for accessing the auth service.
 * It proactively checks for storage availability to prevent Firebase errors
 * in sandboxed environments like iframes.
 */
export function getAuth(): Promise<firebase.auth.Auth> {
  if (!authPromise) {
    authPromise = (async () => {
      const auth = firebase.auth();
      if (isSessionStorageAvailable()) {
        // Preferred persistence for normal browser environments
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      } else {
        // Fallback for sandboxed environments where storage is restricted
        console.warn("Firebase: Session storage not available. Using in-memory persistence.");
        await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
      }
      return auth;
    })();
  }
  return authPromise;
}


// Optional: Analytics only where supported (e.g., avoids SSR issues)
export const analyticsReady = firebase.analytics.isSupported().then((ok) => (ok ? firebase.analytics() : null));
