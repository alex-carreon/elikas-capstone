import api from "@/api";
import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { toast } from "sonner";

function DashboardHeader({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const getProfile = async () => {
      try {
        const getPromise = new Promise(async (resolve, reject) => {
          const response = await api.get("/profile");
          const userData = response.data;

          if (!response) {
            reject(new Error(userData.error || "Getting your data failed"));
          } else resolve(userData);

          setUsername(userData.username);
          setEmail(userData.email);
        });

        toast.promise(getPromise, {
          loading: "Getting your information...",
          error: Error,
          position: "top-center",
        });
      } catch (err: string | any) {
        new Error(err.message || "An error occurred during registration");
      }
    };

    getProfile();
  }, []);

  return (
    <>
      <div className="pt-16 bg-[#FFB13B] px-6 pb-12 flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <div className="w-1/2">
            <p className="text-white BeVietnamPro text-2xl font-bold">
              {title}
            </p>
          </div>
          <div className="text-white BeVietnamPro text-end">
            <p className="text-md">Welcome back,</p>{" "}
            <p className="text-2xl font-bold">{username}</p>
            <p className="text-xs">{email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
      <Outlet />
    </>
  );
}

export default DashboardHeader;
