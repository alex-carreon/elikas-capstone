import api from "@/api";
import { auth } from "@/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { type Dispatch, type SetStateAction } from "react";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  role: string | null;
  token: string | null;
  logout: () => Promise<void>;
  setIsLoginReady: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  role: null,
  token: null,
  logout: async () => {},
  setIsLoginReady: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginReady, setIsLoginReady] = useState(false);

  const publicRoutes = [
    "/Registration",
    "/ResetPassword",
    "/Loading",
    "/Hotlines",
    "/TermsConditions",
  ];

  const roleDefault: Record<string, string> = {
    indiv: "/map",
    brgy_op: "/map",
    admin: "/admin-map",
  };

  const navigate = useNavigate();

  const logout = async () => {
    await auth.signOut();
    setRole(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem("userRole");
    navigate("/Login");
  };

  const remember = localStorage.getItem("rememberMe") === "true";

  useEffect(() => {
    if (remember) return;
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(
        async () => {
          await auth.signOut();
          navigate("/Login");
        },
        60 * 60 * 1000,
      );
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [remember]);

  // Find user in firebase while loading, when user is found loading stops
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const cachedRole = localStorage.getItem("userRole");
      const isSessionStore = !!cachedRole;
      // if (skipAuthContext.current) return;

      if (!firebaseUser || (!isLoginReady && !isSessionStore)) {
        setUser(null);
        setRole(null);
        setToken(null);
        setLoading(false);
        return;
      }

      if (!firebaseUser.emailVerified) {
        setUser(firebaseUser);
        setLoading(false);
        return;
      }

      try {
        const t = await firebaseUser?.getIdTokenResult(false);
        const expiry = new Date(t.expirationTime);

        if (expiry <= new Date()) {
          await auth.signOut();
          navigate("/Login");
          setLoading(false);
          return;
        }

        const currentToken = t.token;

        if (cachedRole) {
          setRole(cachedRole);
          setUser(firebaseUser);
          setToken(currentToken);
          setLoading(false);

          const isOnPublicOrLogin = [...publicRoutes, "/Login"].some((path) =>
            location.pathname.startsWith(path),
          );

          if (isOnPublicOrLogin) {
            navigate(roleDefault[cachedRole] ?? "/Login");
          }
        }

        const loginResponse = await api.post(
          "/auth/login",
          {},
          { headers: { Authorization: `Bearer ${currentToken}` } },
        );
        const userRole = loginResponse.data.role;

        console.log("Setting userRole in localStorage:", userRole);
        localStorage.setItem("userRole", userRole);

        setRole(userRole);
        setUser(firebaseUser);
        setToken(currentToken);
        // navigate(roleDefault[userRole] ?? "/Login");

        if (!cachedRole) {
          const isOnPublicOrLogin = [...publicRoutes, "/Login", "/"].some(
            (path) =>
              location.pathname === path || location.pathname.startsWith(path),
          );
          if (isOnPublicOrLogin) {
            navigate(roleDefault[userRole] ?? "/Login");
          }
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        await auth.signOut();
        navigate("/Login");
        setRole(null);
        setToken(null);
        localStorage.removeItem("userRole");
      }

      setLoading(false);
    });
    return unsubscribe;
  }, [isLoginReady]);

  return (
    <AuthContext.Provider
      value={{ user, loading, role, token, logout, setIsLoginReady }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useUserContext = () => useContext(AuthContext);
