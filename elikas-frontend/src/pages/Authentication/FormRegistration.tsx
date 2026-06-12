import { useNavigate } from "react-router-dom";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import ButtonComp from "@/components/Button";
import Select from "@/components/SelectDropdown";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "@firebase/auth";
import { auth } from "@/firebase";
import RegisterHeader from "@/components/RegisterHeader";
import api from "@/api";
import SelectDropdown from "@/components/SelectDropdown";

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
};

type Cities = {
  id: number;
  name: string;
  parent_id: number;
  parent_location: Province;
};

type Province = {
  id: number;
  level_id: number;
  name: string;
};

function FormRegistration() {
  const [last_name, setLn] = useState("");
  const [first_name, setFn] = useState("");
  const [email, setEmail] = useState("");
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [brgy, setBrgy] = useState("");
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [errors, setErrors] = useState({ pw: "", confirmPw: "", email: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const getCity = async () => {
      try {
        setLoading(true);
        const cityRes = await api.get("/locations/cities");

        const cities = cityRes.data.Cities;
        setCities(cities);
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    getCity();
  }, []);

  useEffect(() => {
    if (!cityId) {
      return;
    }

    const getBrgy = async () => {
      try {
        setBrgyLoad(true);
        const brgyRes = await api.get(`/locations/barangays?city_id=${cityId}`);

        const barangays = brgyRes.data.Barangays;
        setBarangays(barangays);
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setBrgyLoad(false);
      }
    };

    getBrgy();
  }, [cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (pw != confirmPw) {
        throw new Error("Passwords do not match");
      }

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
      } else if (err.code === "auth/password-does-not-meet-requirements") {
        setErrors({
          pw: "Password must be at least 8 characters, and have an uppercase, lowercase, a number, and a special character.",
          confirmPw: "",
          email: "",
        });
      } else if (err instanceof Error) {
        setErrors({
          email: " ",
          pw: "Password do not match",
          confirmPw: "Password do not match",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex justify-evenly flex-col">
        <RegisterHeader />
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
        <form
          id="RegisForm_Form"
          onSubmit={handleSubmit}
          className="flex justify-center flex-col"
        >
          <div className="w-full max-w-xs flex justify-start flex-col self-center gap-5 mt-10 mb-10">
            <TextField
              label="Last Name"
              placeholder="Enter your last name"
              inputType="text"
              id="RegisForm_LNfield"
              isRequired
              onSubmit={(e) => setLn(e.target.value)}
            />
            <TextField
              label="First Name"
              placeholder="Enter your first name"
              inputType="text"
              id="RegisForm_FNfield"
              isRequired
              onSubmit={(e) => setFn(e.target.value)}
            />
            <TextField
              label="Email Address"
              placeholder="Enter your email address"
              inputType="text"
              id="RegisForm_EMAILfield"
              isRequired
              onSubmit={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <SelectDropdown
              value={String(cityId)}
              onValueChange={(val) => setCityId(Number(val))}
              label="City"
              placeholder="Select your City"
              id="RegisForm_CITYfield"
              onSubmit={(e) => setCityId(Number(e.target.value))}
              options={cities?.map((city) => ({
                label: city.name,
                value: String(city.id),
              }))}
              isRequired
              loading={loading}
            />
            <Select
              value={brgy}
              onValueChange={setBrgy}
              label="Barangay"
              placeholder="Select your barangay"
              id="RegisForm_BRGYfield"
              onSubmit={(e) => setBrgy(e.target.value)}
              options={barangays?.map((brgy) => ({
                label: brgy.name,
                value: String(brgy.id),
              }))}
              isRequired
              loading={brgyLoad}
            />
            <TextField
              label="Password"
              placeholder="Enter your password of choice"
              inputType="password"
              isPassword
              id="RegisForm_PWfield"
              isRequired
              onSubmit={(e) => setPw(e.target.value)}
              error={errors.pw}
            />
            <TextField
              label="Confirm Password"
              placeholder="Re-enter your password"
              inputType="password"
              isPassword
              id="RegisForm_CONFIRMPWfield"
              isRequired
              onSubmit={(e) => setConfirmPw(e.target.value)}
              error={errors.confirmPw}
            />
          </div>
          <div className="w-full flex justify-center items-center m-0">
            <ButtonComp
              text="Next"
              variant="primary"
              id="RegisForm_FormSubmit"
              type="submit"
              heightSize="38px"
              widthSize="100%"
            ></ButtonComp>
          </div>
        </form>
      </div>
    </div>
  );
}
export default FormRegistration;
