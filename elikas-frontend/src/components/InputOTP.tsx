import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface InputOTPProps {
  id: string;
}

function InputOTPComp({ id }: InputOTPProps) {
  return (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} id={id}>
      <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
        <InputOTPSlot
          index={0}
          className="border-gray-300 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
        <InputOTPSlot
          index={1}
          className="border-gray-300 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
        <InputOTPSlot
          index={2}
          className="border-gray-300 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
        <InputOTPSlot
          index={3}
          className="border-gray-300 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
        <InputOTPSlot
          index={4}
          className="border-gray-300 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
        <InputOTPSlot
          index={5}
          className="border-gray-300 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
      </InputOTPGroup>
    </InputOTP>
  );
}

export default InputOTPComp;
