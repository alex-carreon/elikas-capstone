import eLikasLogo from "@/assets/logo.svg";
import "@/App.css";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import CheckBox from "@/components/CheckBox";
import ButtonComp from "@/components/Button";
import { Mail } from "lucide-react";
import { Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { toast } from "sonner";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Step 1: Sign in with Firebase — checks email + password
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

      // Step 2: Get the ID token — this is proof of identity sent to Laravel
      const token = await userCredential.user.getIdToken();

      // Step 3: Send token to Laravel to get the user's role
      const loginPromise = new Promise(async (resolve, reject) => {
        const response = await fetch("http://localhost:8000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        // // Step 4: Save user info so other pages can access it
        // localStorage.setItem("user", JSON.stringify(userData));
        const userData = await response.json();

        if (!response.ok) {
          reject(setErrors(userData.error || "Login failed"));
        } else {
          resolve(userData);
        }
      });

      toast.promise(loginPromise, {
        loading: "Logging you in...",
        success: "You're logged in!",
        position: "top-center",
      });

      // Step 5: Redirect based on role
      loginPromise.then((userData: any) => {
        if (userData.role === "admin") {
          window.location.href = "/admin-dashboard";
        } else {
          navigate("/Map");
        }
      });
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
                  {errors.general}
                </p>
                <TextField
                  label="Email"
                  placeholder="Enter your email"
                  icon={Mail}
                  inputType="email"
                  id="LogIn_EmailField"
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
                  id="LogIn_PasswordField"
                  isRequired
                  onSubmit={(e) => setPassword(e.target.value)}
                  error={errors.password}
                ></TextField>
              </div>
              <div className="flex mt-2 flex-row justify-between">
                <CheckBox
                  text="Remember for 30 days"
                  id="LogIn_RememberChckbox"
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
            <div className="w-full flex justify-center items-center m-0">
              <ButtonComp
                text="Log In"
                variant="primary"
                type="submit"
                id="LogIn_SubmitBtn"
                heightSize="38px"
                widthSize="100%"
              ></ButtonComp>
            </div>
          </form>
          <div className="flex justify-start flex-col content-center mx-auto text-sm">
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
          </div>
        </div>
      </div>
    </>
  );
}

export default LogIn;
