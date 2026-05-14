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
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "@firebase/auth";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(email, password);
    console.log("Submitting login form with:", { email, password });

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
        throw new Error("Please verify your email before logging in.");
      }

      // Step 2: Get the ID token — this is proof of identity sent to Laravel
      const token = await userCredential.user.getIdToken();

      console.log("Firebase Token:", token); // to see the token

      // Step 3: Send token to Laravel to get the user's role
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await response.json();

      if (!response.ok) {
        throw new Error(userData.error || "Login failed");
      }

      // // Step 4: Save user info so other pages can access it
      // localStorage.setItem("user", JSON.stringify(userData));

      // Step 5: Redirect based on role
      if (userData.role === "admin") {
        window.location.href = "/admin-dashboard";
      } else {
        window.location.href = "/Map";
      }
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
