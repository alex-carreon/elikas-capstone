import { Link } from "react-router";
import LogoComp from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { Outlet } from "react-router";

function ConstNavbar() {
  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full h-content flex justify-center">
        <div className="w-full max-w-md flex flex-row justify-start items-center p-3 shadow-lg bg-white">
          <Link to="/Guest">
            <ArrowLeft />
          </Link>
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
