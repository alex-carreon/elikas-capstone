import api from "@/api";
import ButtonComp from "@/components/Button";
import colors from "@/constants/colors";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import SettingsIcon from "@/assets/Settings/SettingsIcon.svg";
import { UserCircle, Star, Text } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    <div className="min-h-screen flex justify-center p-6 pt-20">
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
          <Link to="/map">
            <div className="flex flex-col gap-3">
              <div
                id="Settings_AccountBtn"
                className="flex flex-row gap-4 items-center"
              >
                <UserCircle
                  strokeWidth={1.2}
                  size={32}
                  color={colors.heading}
                />
                <p className="font-bold">My Account</p>
              </div>
              <Separator className="bg-gray-200" />
            </div>
          </Link>
          <Link to="">
            <div className="flex flex-col gap-3">
              <div
                id="Settings_FeedbackBtn"
                className="flex flex-row gap-4 items-center"
              >
                <Star strokeWidth={1.2} size={32} color={colors.heading} />
                <p className="font-bold">Give Feedback</p>
              </div>
              <Separator className="bg-gray-200" />
            </div>
          </Link>

          <Link to="">
            <div className="flex flex-col gap-3">
              <div
                id="Settings_TermsBtn"
                className="flex flex-row gap-4 items-center"
              >
                <Text strokeWidth={1.2} size={32} color={colors.heading} />
                <p className="font-bold">Terms and Conditions</p>
              </div>
              <Separator className="bg-gray-200" />
            </div>
          </Link>
        </div>
        <div className="h-full flex justify-center items-end">
          <ButtonComp
            text="Logout"
            variant="primary"
            id="Settings_LogOutBtn"
            onClick={handleLogout}
            heightSize="38px"
            widthSize="100%"
          ></ButtonComp>
        </div>
      </div>
    </div>
  );
}

export default Settings;
