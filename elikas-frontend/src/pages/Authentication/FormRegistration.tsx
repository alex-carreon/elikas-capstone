import { Link, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import ButtonComp from "@/components/Button";
import Select from "@/components/SelectDropdown";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "@firebase/auth";
import { auth } from "@/firebase";

function FormRegistration() {
  const [last_name, setLn] = useState("");
  const [first_name, setFn] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [brgy, setBrgy] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errors, setErrors] = useState({ pw: "", confirmPw: "", email: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pw,
      );

      const firebaseUser = userCredential.user;

      await sendEmailVerification(firebaseUser);

      localStorage.setItem("firebaseUser", firebaseUser.uid);
      localStorage.setItem("last_name", last_name);
      localStorage.setItem("first_name", first_name);
      localStorage.setItem("email", email);
      localStorage.setItem("brgy", brgy);

      navigate("/Registration/Verify");
    } catch (err: string | any) {
      if (err.code === "auth/email-already-in-use") {
        setErrors({
          email: "This email is already registered.",
          pw: "",
          confirmPw: "",
        });
      } else if (err.code === "auth/weak-password") {
        setErrors({
          pw: "Password must be at least 6 characters.",
          confirmPw: "",
          email: "",
        });
      } else if (pw != confirmPw) {
        setErrors({
          email: " ",
          pw: "Password do not match",
          confirmPw: "Password do not match",
        });
      } else {
        setErrors({
          pw: "",
          confirmPw: "",
          email: " ",
        });
      }
    }
  };

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
        <form onSubmit={handleSubmit} className="flex justify-center flex-col">
          <div className="w-full max-w-xs flex justify-start flex-col self-center gap-5 mt-10 mb-10">
            <TextField
              label="Last Name"
              placeholder="Enter your last name"
              inputType="text"
              id="R-LNfield"
              isRequired
              onSubmit={(e) => setLn(e.target.value)}
            />
            <TextField
              label="First Name"
              placeholder="Enter your first name"
              inputType="text"
              id="R-FNfield"
              isRequired
              onSubmit={(e) => setFn(e.target.value)}
            />
            <TextField
              label="Email Address"
              placeholder="Enter your email address"
              inputType="text"
              id="R-EMAILfield"
              isRequired
              onSubmit={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Select
              value={city}
              onValueChange={setCity}
              label="City"
              placeholder="Select your city"
              id="R-CITYfield"
              onSubmit={(e) => setCity(e.target.value)}
              options={[{ label: "San Juan", value: "10" }]}
            />
            <Select
              value={brgy}
              onValueChange={setBrgy}
              label="Barangay"
              placeholder="Select your barangay"
              id="R-BRGYfield"
              onSubmit={(e) => setBrgy(e.target.value)}
              options={[
                { label: "Salapan", value: "11" },
                { label: "Batis", value: "12" },
              ]}
            />
            <TextField
              label="Password"
              placeholder="Enter your password of choice"
              inputType="password"
              isPassword
              id="R-PWfield"
              isRequired
              onSubmit={(e) => setPw(e.target.value)}
              error={errors.pw}
            />
            <TextField
              label="Confirm Password"
              placeholder="Re-enter your password"
              inputType="password"
              isPassword
              id="R-PWfield"
              isRequired
              onSubmit={(e) => setConfirmPw(e.target.value)}
              error={errors.confirmPw}
            />
          </div>
          <div className="w-full flex justify-center items-center m-0">
            {/* <Link to="/Registration/Verify" className="w-full max-w-xs"> */}
            <ButtonComp
              text="Next"
              variant="primary"
              id="R-FormSubmit"
              type="submit"
            ></ButtonComp>
            {/* </Link> */}
          </div>
        </form>
      </div>
    </div>
  );
}
export default FormRegistration;
