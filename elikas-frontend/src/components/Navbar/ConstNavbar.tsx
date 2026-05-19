import LogoComp from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Outlet } from "react-router";
import { useNavigate } from "react-router";

function ConstNavbar() {
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full h-content flex justify-center">
        <div className="w-full max-w-md flex flex-row justify-start items-center p-3 shadow-lg bg-white">
          <ArrowLeft id="Navbar_Back" onClick={() => navigate(-1)} />
          <div className="flex flex-row justify-center items-center w-full">
            <LogoComp />
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default ConstNavbar;
