import { Link, Outlet } from "react-router";
import LogoComp from "../Logo";
import ButtonComp from "@/components/Button";
import { Phone } from "lucide-react";
import colors from "@/constants/colors";

function GuestNavbar() {
  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full h-content flex flex-col justify-center items-center gap-3">
        <div className="w-full max-w-md flex flex-row justify-between items-center p-2 shadow-lg bg-white">
          <Link to="/Login">
            <div>
              <ButtonComp
                text="Sign-in"
                variant="primary"
                id="Navbar_SignIn"
                heightSize="40px"
                widthSize="100%"
              />
            </div>
          </Link>
          <div>
            <LogoComp />
          </div>
          <Link to="/Hotlines">
            <div
              id="NavbarGuest_Hotlines"
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
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default GuestNavbar;
