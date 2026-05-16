import { Link } from "react-router";
import { ArrowLeftIcon } from "lucide-react";
import Logo from "@/components/Logo";
import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import { auth } from "@/firebase";

function Finish() {
  const test = () => {
    const user = auth.currentUser;
    console.log("Current User: ", user);
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <div className="mb-6">
          <Link to="/Registration/Permissions" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="h-3/4 flex justify-center flex-col">
          <div className="flex justify-evenly flex-col">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <div className="flex justify-center flex-col">
              <h1
                className="BeVietnamPro text-2xl text-center font-bold"
                style={{ color: colors.heading }}
              >
                You're good to go!
              </h1>
              <p
                className="text-sm text-center p-1"
                style={{ color: colors.heading }}
              >
                Welcome to eLikas! Help others and stay informed.
              </p>
            </div>
            <div className="w-full flex justify-center items-center mt-6">
              <Link to="/" className="w-full max-w-xs">
                <ButtonComp
                  text="Get Started!"
                  variant="primary"
                  id="R-FinRegis"
                  onClick={test}
                  widthSize="full"
                  heightSize="10"
                ></ButtonComp>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finish;
