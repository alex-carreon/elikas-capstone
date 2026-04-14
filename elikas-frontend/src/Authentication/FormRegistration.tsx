import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import ButtonComp from "@/components/Button";
import Select from "@/components/SelectDropdown";

function FormRegistration() {
  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex justify-evenly flex-col">
        <div className="mb-6">
          <Link to="/Registration/Splash" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="flex justify-center flex-col">
          <h1
            className="BeVietnamPro text-2xl text-center font-bold"
            style={{ color: colors.heading }}
          >
            Create your Account
          </h1>
          <p
            className="text-sm text-center p-1"
            style={{ color: colors.heading }}
          >
            Fill all the needed information
          </p>
        </div>
        <div className="w-full max-w-xs flex justify-start flex-col self-center gap-5 mt-10 mb-10">
          <TextField
            label="Last Name"
            placeholder="Enter your last name"
            inputType="text"
            id="R-LNfield"
          />
          <TextField
            label="First Name"
            placeholder="Enter your first name"
            inputType="text"
            id="R-FNfield"
          />
          <TextField
            label="Email Address"
            placeholder="Enter your email address"
            inputType="text"
            id="R-EMAILfield"
          />
          <TextField
            label="Contact Number"
            placeholder="639023456789"
            inputType="tel"
            id="R-EMAILfield"
          />
          <TextField
            label="City"
            placeholder="Enter your current city of residence"
            inputType="text"
            id="R-CITYfield"
          />
          <Select
            label="Barangay"
            placeholder="Select your barangay"
            id="R-BRGYfield"
          />
          <TextField
            label="Password"
            placeholder="Enter your password of choice"
            inputType="password"
            isPassword
            id="R-PWfield"
          />
          <TextField
            label="Confirm Password"
            placeholder="Re-enter your password"
            inputType="password"
            isPassword
            id="R-PWfield"
          />
        </div>
        <div className="w-full flex justify-center items-center m-0">
          <Link to="/Registration/Verify" className="w-full max-w-xs">
            <ButtonComp
              text="Next"
              variant="primary"
              id="R-FormSubmit"
            ></ButtonComp>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FormRegistration;
