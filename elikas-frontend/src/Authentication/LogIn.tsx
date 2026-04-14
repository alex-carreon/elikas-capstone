import eLikasLogo from "../assets/logo.svg";
import "../App.css";
import colors from "../constants/colors";
import TextField from "../components/TextField";
import CheckBox from "../components/CheckBox";
import ButtonComp from "../components/Button";
import { Mail } from "lucide-react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

function LogIn() {
  return (
    <>
      <div className="min-h-screen flex justify-center p-6">
        <div className="w-full max-w-sm flex justify-evenly flex-col">
          <div className="justify-center content-center">
            <img src={eLikasLogo} className="flex justify-self-center"></img>
            <p
              className={
                "font-BeVietnamPro text-4xl text-center font-bold p-2 "
              }
              style={{ color: colors.heading }}
            >
              eLikas
            </p>
            <p
              className={
                "text-sm flex justify-self-center text-center flex shrink"
              }
              style={{ color: colors.heading }}
            >
              A Community-Centered Disaster Information System
            </p>
          </div>
          <div className="w-full max-w-xs flex justify-start flex-col content-center mx-auto">
            <div className="flex justify-start flex-col content-center gap-5">
              <TextField
                label="Email"
                placeholder="Enter your email"
                icon={Mail}
                inputType="email"
                id="L-EmailField"
              ></TextField>
              <TextField
                label="Password"
                placeholder="********"
                icon={Lock}
                inputType="password"
                isPassword
                id="L-PasswordField"
              ></TextField>
            </div>
            <div className="flex mt-2 flex-row justify-between">
              <CheckBox text="Remember for 30 days" id="L-Remember" />
              <Link
                to="/"
                className={"text-xs underline"}
                style={{ color: colors.label }}
                id="L-ForgotPassword"
              >
                Forgot Password
              </Link>
            </div>
          </div>
          <div className="w-full flex justify-center items-center m-0">
            <Link to="/" className="w-full max-w-xs">
              <ButtonComp
                text="Log In"
                variant="primary"
                id="L-Submit"
              ></ButtonComp>
            </Link>
          </div>
          <div className="flex justify-start flex-col content-center mx-auto">
            <p className={"text-sm flex justify-self-center"}>
              Don't have an account yet? &nbsp;
              <Link to="/Registration/Splash" id="L-Register">
                <span
                  className={"text-sm flex justify-self-center underline"}
                  style={{ color: colors.activeIcon }}
                >
                  Register Now
                </span>
              </Link>
              !
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LogIn;
