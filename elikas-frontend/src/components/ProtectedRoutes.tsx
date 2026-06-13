import { useUserContext } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate, Outlet, Navigate } from "react-router";
import logo from "@/assets/logo.svg";
import colors from "@/constants/colors";
import { Spinner } from "./ui/spinner";

// import { type ReactNode } from "react";

interface ProtectedRouteProps {
  userRole?: string | string[];
}

export const roleDefault: Record<string, string> = {
  indiv: "/map",
  brgy_op: "/map",
  admin: "/admin-map",
};

export default function ProtectedRoute({ userRole }: ProtectedRouteProps) {
  const { user, loading, role } = useUserContext();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex justify-center">
        <div className="w-full max-w-md flex justify-center items-center flex-col gap-8">
          <div className="flex flex-col gap-2">
            <img src={logo} className="mr-4" />
            <p
              className="self-center BeVietnamPro font-bold text-3xl"
              style={{ color: colors.heading }}
            >
              eLikas
            </p>
          </div>
          <Spinner className="size-8 text-gray-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  if (userRole && role !== userRole) {
    const fallback = roleDefault[role ?? ""] ?? "/Login";
    return <Navigate to={fallback} replace />;
  }

  if (userRole && role) {
    const allowed = Array.isArray(userRole) ? userRole : [userRole];
    if (!allowed.includes(role)) {
      const fallback = roleDefault[role ?? ""] ?? "/Login";
      return <Navigate to={fallback} replace />;
    }
  }

  if (!user) {
    return;
  }

  return <Outlet />;
}
