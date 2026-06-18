import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import TextField from "@/components/TextField";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import api from "@/api";
import { toast } from "sonner";

function ChangeEmail() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (auth.currentUser) {
      try {
        const response = api.patch("/profile/change-email", { email });

        console.log(response);

        toast.promise(response, {
          loading: "Changing your email...",
          success: "Check your inbox or spam for the confirmation email.",
          error: (err) => {
            setSuccess(false);
            return err.response?.data?.message;
          },
        });

        if ((await response).request.status === 200) {
          await signOut(auth);
        }
      } catch (err: any) {
        console.log(err.response.message);
      }
    }

    // if (success) {
    // }
  };

  useEffect(() => {
    console.log("success", success);
  }, [success]);

  return (
    <div className="min-h-screen flex justify-center p-6 mt-12">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="h-1/2 flex justify-center flex-col gap-4">
          <div className="mb-8">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Change your email!
            </h1>
            <p
              className="text-sm text-center p-1"
              style={{ color: colors.heading }}
            >
              Enter your email below and an email from eLikas will be sent to
              you for verification.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <TextField
              label="Email"
              id="ForgetPW_EmailField"
              inputType="text"
              onSubmit={(e) => setEmail(e.target.value)}
              isRequired
            />
            <div className="flex justify-center items-center flex-col gap-2">
              <ButtonComp
                text="Send Email"
                variant="primary"
                id="ForgetPW_ResendBtn"
                onClick={(e) => submitEmail(e)}
                heightSize="38px"
                widthSize="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangeEmail;
