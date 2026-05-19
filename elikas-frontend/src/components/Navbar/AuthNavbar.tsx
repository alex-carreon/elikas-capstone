import { Link, Outlet } from "react-router";
import LogoComp from "../Logo";
import { Phone, MapPin, CircleUser, MessageSquare } from "lucide-react";
import colors from "@/constants/colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserContext } from "@/context/AuthContext";

function AuthNavbar() {
  const { role } = useUserContext();

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full h-content flex justify-center">
        <div className="w-full max-w-md flex flex-row justify-between items-center p-3 shadow-lg bg-white">
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
                  <MessageSquare style={{ color: colors.heading }} />
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
              <div className="flex flex-col justify-center items-center">
                <Phone style={{ color: colors.heading }} />
                <p
                  className="text-xs text-center p-1"
                  style={{ color: colors.label }}
                >
                  Hotlines
                </p>
              </div>
            </Link>
            <Link to="">
              <div className="flex flex-col justify-center items-center">
                <MapPin style={{ color: colors.heading }} />
                <p
                  className="text-xs text-center p-1"
                  style={{ color: colors.label }}
                >
                  History
                </p>
              </div>
            </Link>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex flex-col justify-center items-center">
                  <CircleUser style={{ color: colors.heading }} />
                  <p
                    className="text-xs text-center p-1"
                    style={{ color: colors.label }}
                  >
                    Profile
                  </p>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup className="flex items-center flex-col">
                    <DropdownMenuItem>My Account</DropdownMenuItem>
                    <DropdownMenuItem>Give Feedback</DropdownMenuItem>
                    <Link to="/Settings">
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default AuthNavbar;
