import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import Logo from "@/components/Logo";
import colors from "@/constants/colors";
import Switch from "@/components/Switch";
import ButtonComp from "@/components/Button";

function Permissions() {
  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <div className="mb-6">
          <Link to="/Registration/CustomProfile" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="h-full flex justify-evenly flex-col">
          <div className="h-1/2 flex justify-evenly flex-col">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Lastly, we would to ask for your permission...
            </h1>
          </div>

          <div className="h-full flex justify-between flex-col">
            <div className="flex flex-col gap-8">
              <Switch
                label="Location"
                description="Your location will be needed be able to guide you to your nearest evacuation center, as well as help you provide and gain information as accurately as possible."
                id="R-LocSwitch"
              />
              <Switch
                label="Camera"
                description="Posting a photo alongside marking a pin or commenting would greatly support the validity of your information. It is highly recommended to allow camera permissions to allow the full experience."
                id="R-CamSwitch"
              />
            </div>
            <div className="w-full flex justify-center items-center m-0">
              <Link to="/" className="w-full max-w-xs">
                <ButtonComp
                  text="Next"
                  variant="primary"
                  id="R-NextPermissions"
                ></ButtonComp>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Permissions;
