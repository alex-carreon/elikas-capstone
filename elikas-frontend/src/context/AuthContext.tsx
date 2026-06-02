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

  // Find user in firebase while loading, when user is found loading stops
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          const t = await user?.getIdToken(true);
          setToken(t);

          const LoginResponse = await api.post(
            "/auth/login",
            {},
            {
              headers: {
                Authorization: `Bearer ${t}`,
              },
            },
          );

          const userData = await LoginResponse;
          setRole(userData.data.role);
        } catch (err: any | null) {
          setRole(null);
        }
      } else {
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
