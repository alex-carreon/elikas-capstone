import { Link, Outlet } from "react-router";
import LogoComp from "../Logo";
import ButtonComp from "@/components/Button";
import { Phone } from "lucide-react";
import colors from "@/constants/colors";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

function GuestNavbar() {
  const [closeAlert, setCloseAlert] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full h-content flex flex-col justify-center items-center gap-3">
        <div className="w-full max-w-md flex flex-row justify-between items-center p-3 shadow-lg bg-white">
          <Link to="/Login">
            <div>
              <ButtonComp
                text="Sign-in"
                variant="primary"
                id="G01-SignIn"
                heightSize="10"
                widthSize="20"
              />
            </div>
          </Link>
          <div>
            <LogoComp />
          </div>
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
        </div>
        {closeAlert ? null : (
          <div className="mx-4">
            <Alert className="w-full max-w-sm p-4 shadow-lg bg-[#FFF1DD] text-center flex flex-col items-center gap-3">
              {/* <CheckCircle2Icon /> */}
              <AlertTitle
                className="font-bold"
                style={{ color: colors.heading }}
              >
                You are logged out!
              </AlertTitle>
              <AlertDescription style={{ color: colors.heading }}>
                You are now in guest mode. You can still explore the map, but
                you’ll need an account to join the conversation.
              </AlertDescription>
              <Button className="w-2/3" onClick={() => setCloseAlert(true)}>
                Got it!
              </Button>
            </Alert>
          </div>
        )}
      </div>
      <Outlet />
    </>
  );
}

export default GuestNavbar;
