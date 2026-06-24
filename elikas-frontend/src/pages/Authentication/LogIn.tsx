import eLikasLogo from "@/assets/logo.svg";
import "@/App.css";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import CheckBox from "@/components/CheckBox";
import ButtonComp from "@/components/Button";
import { Mail } from "lucide-react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { toast } from "sonner";
import api from "@/api";
import { useUserContext } from "@/context/AuthContext";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const { setIsLoginReady } = useUserContext();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = api.post("/email/resend-verification", {
        email: email,
      });

      toast.promise(response, {
        loading: "Sending you your verification email...",
        success: "Email verification has been sent.",
        error: (err: any) => {
          return err.response.message;
        },
        position: "top-center",
      });
    } catch (err: any) {
      console.log(err.response.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await auth.signOut();

      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );

      localStorage.setItem("rememberMe", String(remember));

      localStorage.removeItem("userRole");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      if (!userCredential.user.emailVerified) {
        // Optionally sign them out so they can't access protected routes
        await auth.signOut();
        setErrors({
          email: "",
          password: "",
          general: "Please verify your email before logging in.",
        });
        return;
      }

      const token = await userCredential.user.getIdToken(true);

      const response = api.post(
        "/auth/login",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response);

      toast.promise(response, {
        loading: "Logging you in...",
        success: "You're logged in!",
        error: "User not found",
        position: "top-center",
      });

      await response;
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsLoginReady(true);
    } catch (err: string | any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setErrors({ ...errors, general: "Incorrect email or password." });
      } else if (err.code === "auth/too-many-requests") {
        setErrors({
          ...errors,
          general: "Too many failed attempts. Please try again later.",
        });
      } else {
        setErrors(err.message);
      }
    }
  };

  useEffect(() => {
    localStorage.removeItem("last_name");
    localStorage.removeItem("first_name");
    localStorage.removeItem("email");
    localStorage.removeItem("brgy");
    localStorage.removeItem("pw");
    localStorage.removeItem("city");
    localStorage.removeItem("contact");
    localStorage.removeItem("username");
    localStorage.removeItem("avatarSeed");
  }, []);

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
            id="LogIn_Form"
            onSubmit={handleSubmit}
            className="h-1/3 flex justify-between flex-col gap-8"
          >
            <div className="w-full max-w-xs flex justify-start flex-col content-center mx-auto">
              <div className="flex justify-start flex-col content-center gap-5">
                <p className="text-sm text-center text-red-500">
                  {errors.general ===
                  "Please verify your email before logging in." ? (
                    <span>
                      Please verify your email.{" "}
                      <span
                        onClick={(e) => handleVerify(e)}
                        className="underline italic"
                        id="LogIn_VerifyEmail"
                      >
                        Verify here.
                      </span>
                    </span>
                  ) : (
                    errors.general
                  )}
                </p>
                <TextField
                  label="Email"
                  icon={Mail}
                  inputType="email"
                  id="LogIn_EmailField"
                  isRequired
                  onSubmit={(e) => setEmail(e.target.value)}
                  error={errors.email}
                ></TextField>
                <TextField
                  label="Password"
                  icon={Lock}
                  inputType="password"
                  isPassword
                  id="LogIn_PasswordField"
                  isRequired
                  onSubmit={(e) => setPassword(e.target.value)}
                  error={errors.password}
                ></TextField>
              </div>
              <div className="flex mt-2 flex-row justify-between">
                <CheckBox
                  text="Remember Me"
                  id="LogIn_RememberChckbox"
                  checked={remember}
                  onCheckedChange={setRemember}
                />
                <Link
                  to="/ResetPassword"
                  className={"text-xs underline"}
                  style={{ color: colors.label }}
                  id="LogIn_ForgotPasswordBtn"
                >
                  Forgot Password
                </Link>
              </div>
            </div>
            <div className="w-full flex flex-col justify-center items-center m-0 gap-2">
              <ButtonComp
                text="Log In"
                variant="primary"
                type="submit"
                id="LogIn_SubmitBtn"
                heightSize="38px"
                widthSize="100%"
              ></ButtonComp>
              <Link to="/" className="w-full flex justify-center">
                <ButtonComp
                  text="View the Map"
                  variant="outline"
                  type="button"
                  id="LogIn_MapBtn"
                  heightSize="38px"
                  widthSize="100%"
                ></ButtonComp>
              </Link>
            </div>
          </form>
          <div className="flex justify-start flex-col content-center mx-auto text-sm gap-3 mt-24">
            <p className={"flex justify-self-center truncate"}>
              Don't have an account yet? &nbsp;
              <Link to="/Registration/Splash" id="L-Register">
                <span
                  id="LogIn_RegisterBtn"
                  className={"flex justify-self-center underline truncate"}
                  style={{ color: colors.activeIcon }}
                >
                  Register Now
                </span>
              </Link>
              !
            </p>
            <p className="text-center">
              Contact us at{" "}
              <span
                className="font-medium"
                style={{ color: colors.activeIcon }}
              >
                elikasteam@gmail.com
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LogIn;
