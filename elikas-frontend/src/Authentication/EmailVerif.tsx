import Logo from "@/components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import InputOTPComp from "@/components/InputOTP";
import colors from "@/constants/colors";

function EmailVerif() {
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
              An email was sent to sample@mail.com. Copy the code and enter it
              below to verify your account!
            </p>
          </div>
          <div className="flex justify-center">
            <InputOTPComp id="R-EmailVerify" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerif;
