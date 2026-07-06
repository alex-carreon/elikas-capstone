import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  CustomProvider,
} from "firebase/app-check";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

const getAppCheckProvider = () => {
  const playwrightDebugToken = typeof window !== 'undefined' 
    ? (window as any).__PLAYWRIGHT_APP_CHECK_TOKEN__
    : null;

  if (playwrightDebugToken) {
    return new CustomProvider({
      getToken: () => Promise.resolve({
        token: playwrightDebugToken,
        expireTimeMillis: Date.now() + 1000 * 60 * 30, 
      })
    });
  }

  if (import.meta.env.DEV && typeof self !== 'undefined') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  return new ReCaptchaV3Provider("6Lc7EEUtAAAAACb8xacqDgunvlT9PuSzGgOrh156");
};

// 3. Initialize App Check
export const appCheck = initializeAppCheck(app, {
  provider: getAppCheckProvider(),
  isTokenAutoRefreshEnabled: true
});

export default app;
