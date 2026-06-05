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

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  role: string | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  role: null,
  token: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const navigate = useNavigate();

  // Find user in firebase while loading, when user is found loading stops
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setToken(null);
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

        if (!role) {
          const loginResponse = await api.post(
            "/auth/login",
            {},
            { headers: { Authorization: `Bearer ${currentToken}` } },
          );
          setRole(loginResponse.data.role);
        }

        setUser(firebaseUser);
        setToken(currentToken);
      } catch (err: any) {
        await auth.signOut;
        navigate("/Login");
        setRole(null);
        setToken(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useUserContext = () => useContext(AuthContext);
