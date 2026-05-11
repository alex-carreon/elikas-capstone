import Logo from "@/components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
// import InputOTPComp from "@/components/InputOTP";
import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";

function EmailVerif() {
  const emailData = localStorage.getItem("email");

  // const handleVerify = (e:React.FormEvent) => {
  //   e.preventDefault();

  //   //Call API here - try !response.ok return error, else redirect, catch server error
  // }

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
            <Link to="/Registration/CustomProfile" className="w-full max-w-xs">
              <ButtonComp
                text="Verify Email"
                variant="primary"
                id="R-VerifyEmail"
              />
            </Link>

            <ButtonComp
              text="Resend Email Verification"
              variant="outline"
              id="R-ResendEmail"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerif;
