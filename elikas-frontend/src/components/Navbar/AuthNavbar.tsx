import { Link, Outlet } from "react-router";
import LogoComp from "../Logo";
import { Phone, MapPin, MessageSquare, Settings } from "lucide-react";
import colors from "@/constants/colors";
import { useUserContext } from "@/context/AuthContext";

function AuthNavbar() {
  const { role } = useUserContext();

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full h-content flex justify-center">
        <div className="w-full max-w-md flex flex-row justify-between items-center p-2 shadow-lg bg-white">
          <div>
            <LogoComp />
          </div>
          <div className="flex flex-row gap-1">
            {role === "brgy_op" && (
              <Link to="/SMS">
                <div
                  id="Navbar_SMS"
                  className="flex flex-col justify-center items-center"
                >
                  <MessageSquare style={{ color: colors.heading }} size={20} />
                  <p
                    className="text-xs text-center p-1"
                    style={{ color: colors.label }}
                  >
                    SMS
                  </p>
                </div>
              </Link>
            )}
            <Link to="/Hotlines">
              <div
                id="Navbar_Hotlines"
                className="flex flex-col justify-center items-center"
              >
                <Phone style={{ color: colors.heading }} size={20} />
                <p
                  className="text-xs text-center p-1"
                  style={{ color: colors.label }}
                >
                  Hotlines
                </p>
              </div>
            </Link>
            <Link to="/History">
              <div
                id="Navbar_History"
                className="flex flex-col justify-center items-center"
              >
                <MapPin style={{ color: colors.heading }} size={20} />
                <p
                  className="text-xs text-center p-1"
                  style={{ color: colors.label }}
                >
                  History
                </p>
              </div>
            </Link>
            <Link to="/Settings">
              <div
                id="Navbar_Settings"
                className="flex flex-col justify-center items-center"
              >
                <Settings style={{ color: colors.heading }} size={20} />
                <p
                  className="text-xs text-center p-1"
                  style={{ color: colors.label }}
                >
                  Settings
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default AuthNavbar;
