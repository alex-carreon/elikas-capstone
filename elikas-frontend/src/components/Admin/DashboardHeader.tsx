import api from "@/api";
import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { Skeleton } from "../ui/skeleton";

function DashboardHeader({
  children,
  title,
}: {
  children?: React.ReactNode;
  title: string;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const getProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/profile", {
          signal: controller.signal,
        });
        const userData = response.data;

        setUsername(userData.username);
        setEmail(userData.email);
        setLoading(false);
      } catch (err: string | any) {
        if (err.name === "CanceledError") return;
        console.log(err.response?.data);
        setLoading(false);
      }
    };

    getProfile();
    return () => controller.abort();
  }, []);

  return (
    <>
      <div className="pt-4 bg-[#FFB13B] px-6 pb-12 flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <div className="w-1/2">
            <p className="text-white BeVietnamPro text-2xl font-bold">
              {title}
            </p>
          </div>
          <div className="text-white BeVietnamPro text-end">
            <p className="text-md">Welcome back,</p>
            {loading ? (
              <div className="flex flex-col gap-2 items-end mt-2">
                <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
                <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">{username}</p>
                <p className="text-xs">{email}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2">{children}</div>
      </div>
      <Outlet />
    </>
  );
}

export default DashboardHeader;
