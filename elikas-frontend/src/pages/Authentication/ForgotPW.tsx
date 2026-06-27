import colors from "@/constants/colors";
import { useState } from "react";
import TextField from "@/components/TextField";
import ButtonComp from "@/components/Button";
import RegisterHeader from "@/components/RegisterHeader";
import api from "@/api";
import { toast } from "sonner";

function ForgotPW() {
  const [email, setEmail] = useState("");
  const [disabled, setDisabled] = useState(false);

  const handleResetPW = async () => {
    setDisabled(true);
    const response = api.post("/forgot-password", { email: email });

    console.log(response);

    toast.promise(response, {
      loading: "Verifying your email...",
      success: "An email has been sent!",
      error: (err: any) => {
        if (err.response.data.details === "RESET_PASSWORD_EXCEED_LIMIT") {
          return "Too many attempts. Please try again later.";
        }
        return "An unexpected error occurred.";
      },
    });

    response.finally(() => setDisabled(false));
  };

  return (
    <>
      {/* <Toaster position="top-center" /> */}
      {/* {showToast && <CustomToast />} */}
      <div className="min-h-screen flex justify-center p-6 mt-12">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <RegisterHeader />
          <div className="h-1/2 flex justify-center flex-col gap-4">
            <div className="mb-8">
              <h1
                className="BeVietnamPro text-2xl text-center font-bold"
                style={{ color: colors.heading }}
              >
                Check your email to reset your password!
              </h1>
              <p
                className="text-sm text-center p-1"
                style={{ color: colors.heading }}
              >
                Enter your account's email. An email will be sent to reset your
                password.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <TextField
                label="Email"
                id="ForgetPW_EmailField"
                inputType="text"
                onSubmit={(e) => setEmail(e.target.value)}
              />
              <div className="flex justify-center items-center flex-col gap-2">
                <ButtonComp
                  text="Send Email"
                  variant="primary"
                  id="ForgetPW_ResendBtn"
                  onClick={handleResetPW}
                  heightSize="38px"
                  widthSize="100%"
                  isDisabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPW;
