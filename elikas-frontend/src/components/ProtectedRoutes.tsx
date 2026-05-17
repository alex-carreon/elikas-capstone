import { useUserContext } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
// import { type ReactNode } from "react";

interface ProtectedRouteProps {
  userRole?: string | string[];
}

export const roleDefault: Record<string, string> = {
  indiv: "/map",
};

export default function ProtectedRoute({ userRole }: ProtectedRouteProps) {
  const { user, loading, role } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    // if (loading) {
    //   navigate("/");
    // }

    if (!loading) {
      if (!user) {
        navigate("/");
      }
    }
    if (userRole && role) {
      if (userRole && role !== userRole) {
        const fallback = roleDefault[role] ?? "/map";

        navigate(fallback);
      }
    }
    // if (loading) {
    //   navigate("/Login");
    // }
    // if (!user) {
    //   navigate("/");
    // }
    // if (!loading && user) {
    // }
  });

  return <Outlet />;
}
