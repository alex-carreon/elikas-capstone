import Logo from "@/components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import { auth } from "@/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";

function EmailVerif() {
  const emailData = localStorage.getItem("email");
  const navigate = useNavigate();

  const [message, setMessage] = useState("");

  const handleResend = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please register again first.");
      }

      await sendEmailVerification(user);
      setMessage("Verification email sent again. Check your inbox/spam.");
    } catch (err: string | any) {
      setMessage(err.message);
    }
  };

  const checkVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        navigate("/Registration/Contact");
      } else {
        setMessage("Still not verified.");
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <div className="mb-6">
          <Link to="/Registration/Form" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="h-1/2 flex justify-center flex-col">
          <div className="mb-8">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Check your email for your account verification!
            </h1>
            <p
              className="text-sm text-center p-1"
              style={{ color: colors.heading }}
            >
              An email was sent to <b>{emailData}</b>. Copy the code and enter
              it below to verify your account!
            </p>
          </div>
          <div className="flex justify-center items-center flex-col gap-2">
            {/* <p className="text-xs text-red-500 font-bold">
              You're lying it aint verified
            </p> */}
            <p
              className="text-sm text-center p-1"
              style={{ color: colors.heading }}
            >
              {message}
            </p>
            <ButtonComp
              text="Verify Email"
              variant="primary"
              id="R-VerifyEmail"
              onClick={checkVerification}
            />

            <ButtonComp
              text="Resend Email Verification"
              variant="outline"
              id="R-ResendEmail"
              onClick={handleResend}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerif;
