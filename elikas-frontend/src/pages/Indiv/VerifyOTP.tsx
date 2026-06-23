import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import { useRef, useState, useEffect } from "react";
import InputOTPComp from "@/components/InputOTP";
import api from "@/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";

function VerifyOTP() {
  const [elapsed, setElapsed] = useState(60);
  const [running, setRunning] = useState(false);
  const [otp, setOtp] = useState(0);
  const [disabled, setDisabled] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const phoneNumber = localStorage.getItem("phone_number");

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const submitOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setDisabled(true);
      const response = api.post("/otp/verify", {
        phone_number: phoneNumber,
        otp: String(otp),
      });

      toast.promise(response, {
        loading: "Processing your verification...",
        success: "Contact Number verified!",
        error: "Contact Number verification failed. Please try agian.",
        position: "top-center",
      });

      response.then(() => {
        navigate("/Profile");
      });
      setDisabled(false);
    } catch (err: any) {
      setDisabled(false);
      console.log(err.response.message);
    }
  };

  const resendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setDisabled(true);
      const response = api.post("/otp/send", {
        phone_number: phoneNumber,
        message: `OTP Resent! Do not share this OTP with others. Here is your code: :otp`,
      });

      toast.promise(response, { success: "OTP has been sent to your number." });

      setDisabled(false);
    } catch (err: any) {
      setDisabled(false);
      console.log(err.response?.message);
    }
  };

  useEffect(() => {
    setRunning(true);
    if (running) {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setRunning(false);
            return 0;
          }
          return e - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
    }

    return () => {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
    };
  }, [running]);

  return (
    <div className="min-h-screen flex justify-center p-6 pt-12">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="h-1/2 flex justify-center flex-col gap-4">
          <div className="mb-8">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Enter the OTP sent to your number!
            </h1>
            <p
              className="text-sm text-center p-1"
              style={{ color: colors.heading }}
            >
              You're one step away from receiving SMS Notifications from your
              barangay!
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-full flex flex-col items-center gap-1">
              <InputOTPComp
                id="VerifyOTPField"
                onChange={(val) => setOtp(Number(val))}
              />
              <p className="text-xs italic" style={{ color: colors.label }}>
                You may resend after {formatTime(elapsed)}
              </p>
            </div>
            <div className="flex justify-center items-center flex-col gap-2">
              <ButtonComp
                text="Resend OTP"
                variant="outline"
                id="ForgetPW_ResendBtn"
                onClick={(e) => {
                  setElapsed(60);
                  resendOTP(e);
                }}
                heightSize="38px"
                widthSize="100%"
                isDisabled={elapsed !== 0}
              />
              <ButtonComp
                text="Verify"
                variant="primary"
                id="ForgetPW_ResendBtn"
                onClick={(e) => submitOTP(e)}
                heightSize="38px"
                widthSize="100%"
                isDisabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
