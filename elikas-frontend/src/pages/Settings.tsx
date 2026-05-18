import api from "@/api";
import ButtonComp from "@/components/Button";
import colors from "@/constants/colors";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SettingsIcon from "@/assets/Settings/SettingsIcon.svg";
import { Switch } from "@/components/ui/switch";

function Settings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await api.post("/auth/logout");
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6 mt-13">
      <div className="w-full max-w-sm flex flex-col gap-10">
        <div>
          <p className="font-bold text-2xl" style={{ color: colors.heading }}>
            Settings
          </p>
        </div>
        <div className="w-full flex justify-center">
          <img src={SettingsIcon} className="w-60" />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-row justify-between items-center">
              <p
                className="font-bold text-lg"
                style={{ color: colors.activeIcon }}
              >
                Location
              </p>
              <Switch />
            </div>
            <p className="text-sm">
              Your location will be needed be able to {""}
              <b>guide you to your nearest evacuation center</b>, as well as
              help you <b>provide and gain information</b> as accurately as
              possible.
            </p>
          </div>
          <div>
            <div className="flex flex-row justify-between items-center">
              <p
                className="font-bold text-lg"
                style={{ color: colors.activeIcon }}
              >
                Camera
              </p>
              <Switch />
            </div>
            <p className="text-sm">
              <b>Posting a photo alongside marking a pin</b> would greatly
              support the validity of your information. It is highly recommended
              to allow camera permissions to allow the full experience.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <ButtonComp
            text="Logout"
            variant="primary"
            id="Settings_LogOutBtn"
            onClick={handleLogout}
            widthSize="full"
            heightSize="10"
          ></ButtonComp>
        </div>
      </div>
    </div>
  );
}

export default Settings;
