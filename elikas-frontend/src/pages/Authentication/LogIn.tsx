import eLikasLogo from "@/assets/logo.svg";
import "@/App.css";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import CheckBox from "@/components/CheckBox";
import ButtonComp from "@/components/Button";
import { Mail } from "lucide-react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(email, password);

    //Call API here - try !response.ok return error, else redirect, catch server error
    // setErrors({
    //   email: "Invalid email or password",
    //   password: "Invalid email or password",
    // });
  };

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
          <form
            onSubmit={handleSubmit}
            className="h-1/3 flex justify-between flex-col"
          >
            <div className="w-full max-w-xs flex justify-start flex-col content-center mx-auto">
              <div className="flex justify-start flex-col content-center gap-5">
                <TextField
                  label="Email"
                  placeholder="Enter your email"
                  icon={Mail}
                  inputType="email"
                  id="L-EmailField"
                  isRequired
                  onSubmit={(e) => setEmail(e.target.value)}
                  error={errors.email}
                ></TextField>
                <TextField
                  label="Password"
                  placeholder="********"
                  icon={Lock}
                  inputType="password"
                  isPassword
                  id="L-PasswordField"
                  isRequired
                  onSubmit={(e) => setPassword(e.target.value)}
                  error={errors.password}
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
              {/* <Link to="/" className="w-full max-w-xs"> */}
              <ButtonComp
                text="Log In"
                variant="primary"
                type="submit"
                id="L-Submit"
              ></ButtonComp>
              {/* </Link> */}
            </div>
          </form>
          <div className="flex justify-start flex-col content-center mx-auto text-sm">
            <p className={"flex justify-self-center truncate"}>
              Don't have an account yet? &nbsp;
              <Link to="/Registration/Splash" id="L-Register">
                <span
                  className={"flex justify-self-center underline truncate"}
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
