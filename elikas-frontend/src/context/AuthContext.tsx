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
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  role: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Find user in firebase while loading, when user is found loading stops
  useEffect(() => {
    console.log("Auth starting");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User is:", user);
      setUser(user);

      if (user) {
        try {
          const token = await user?.getIdToken();

          const response = await api.post("/auth/login", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const userData = await response;
          console.log("response", userData);
          setRole(userData.data.role);
        } catch (err: any | null) {
          console.log("error in role: ", err);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useUserContext = () => useContext(AuthContext);
