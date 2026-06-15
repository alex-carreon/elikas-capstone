import colors from "@/constants/colors";
import { useState } from "react";
import TextField from "@/components/TextField";
import ButtonComp from "@/components/Button";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { EmailToast } from "@/components/ToastSuccess";
import RegisterHeader from "@/components/RegisterHeader";

function ForgotPW() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleResetPW = () => {
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        EmailToast();
      })
      .catch((error) => {
        if (error.code === "auth/missing-email") {
          setError("Please enter your email.");
        } else setError(error.code);
      });
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
            <p className="text-red-500 text-xs text-center">{error}</p>
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
