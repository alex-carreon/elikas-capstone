import ButtonComp from "@/components/Button";
import Logo from "@/components/Logo";
import TextField from "@/components/TextField";
import colors from "@/constants/colors";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

function ContactNo() {
  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <div className="mb-6">
          <Link to="/Registration/Verify" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="h-full flex justify-between flex-col">
          <div className="h-1/2 flex justify-evenly flex-col">
            <div>
              <h1
                className="BeVietnamPro text-2xl text-center font-bold"
                style={{ color: colors.heading }}
              >
                Receive Updates from your Local Barangays!
              </h1>
              <p
                className="text-sm text-center p-2"
                style={{ color: colors.heading }}
              >
                Enter your Phone Number in order to receive the latest updates
                from your barangays themselves.{" "}
                <b>You may enter your contact number later.</b>
              </p>
            </div>
            <div className="flex justify-center">
              <TextField
                label="Contact Number"
                placeholder="639081057526"
                inputType="tel"
                id="R-ContactNo"
              />
            </div>
          </div>
          <div className="w-full flex justify-center items-center m-0 flex-col gap-2">
            <Link to="/Registration/Verify" className="w-full max-w-xs">
              <ButtonComp
                text="Next"
                variant="primary"
                id="R-FormSubmit"
              ></ButtonComp>
            </Link>
            <Link to="/Registration/Verify" className="w-full max-w-xs">
              <ButtonComp
                text="Skip"
                variant="outline"
                id="R-FormSubmit"
              ></ButtonComp>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactNo;
