import api from "@/api";
import ProtectedRoute from "@/components/ProtectedRoutes";
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

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  role: string | null;
  token: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  role: null,
  token: null,
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const publicRoutes = [
    "/Login",
    "/Registration",
    "/ResetPassword",
    "/Loading",
    "/Hotlines",
    "/TermsConditions",
  ];

  const isPublicRoute = publicRoutes.some((path) =>
    location.pathname.startsWith(path),
  );

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
    navigate("/Login");
  };

  // Find user in firebase while loading, when user is found loading stops
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // if (skipAuthContext.current) return;

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setToken(null);
        setLoading(false);
        return;
      }

      // if (isPublicRoute) return;

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

        if (!role || !isPublicRoute) {
          const loginResponse = await api.post(
            "/auth/login",
            {},
            { headers: { Authorization: `Bearer ${currentToken}` } },
          );
          const userRole = loginResponse.data.role;

          setRole(userRole);
          setUser(firebaseUser);
          setToken(currentToken);
          navigate(roleDefault[userRole] ?? "/Login");

          // if (isPublicRoute) {
          //   // only redirect if coming from a public route
          // }
        }
      } catch (err: any) {
        await auth.signOut();
        navigate("/Login");
        setRole(null);
        setToken(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useUserContext = () => useContext(AuthContext);
