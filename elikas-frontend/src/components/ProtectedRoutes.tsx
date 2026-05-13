import { useUserContext } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
// import { type ReactNode } from "react";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

export default function ProtectedRoute() {
  const { user, loading } = useUserContext();
  const navigate = useNavigate();

  if (loading) {
    return <div></div>;
  }
  if (!user) {
    navigate("/");
  }

  return <Outlet />;
}
