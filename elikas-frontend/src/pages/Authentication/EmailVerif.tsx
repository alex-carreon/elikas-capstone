import { useNavigate } from "react-router";
import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import { auth } from "@/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import RegisterHeader from "@/components/RegisterHeader";
import { toast } from "sonner";

function EmailVerif() {
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  const email = auth.currentUser?.email;

  const [message, setMessage] = useState("");

  const handleResend = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please register again first.");
      }

      await sendEmailVerification(user);
      toast.info("Verification email sent again. Check your inbox/spam.");
    } catch (err: string | any) {
      setMessage(err.message);
    }
  };

  const checkVerification = async () => {
    if (auth.currentUser) {
      setDisabled(true);
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        navigate("/Registration/Finish");
        setDisabled(false);
      } else {
        toast.error("Still not verified.");
        setDisabled(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <RegisterHeader />
        <div className="h-1/2 flex justify-center flex-col">
          <div className="mb-8">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Almost there! Check your email for your account verification.
            </h1>
            <p
              className="text-sm text-center p-1"
              style={{ color: colors.heading }}
            >
              An email was sent to <b>{email}</b>. Make sure to check the spam.
              Click the link and you're good to go!
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
              id="VerifyEmail_ConfirmBtn"
              onClick={checkVerification}
              heightSize="38px"
              widthSize="100%"
              isDisabled={disabled}
            />
            <ButtonComp
              text="Resend Email Verification"
              variant="outline"
              id="VerifyEmail_ResendBtn"
              onClick={handleResend}
              heightSize="38px"
              widthSize="100%"
              isDisabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerif;
