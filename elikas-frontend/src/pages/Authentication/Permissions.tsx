import { useNavigate } from "react-router";
import colors from "@/constants/colors";
import Switch from "@/components/Switch";
import ButtonComp from "@/components/Button";
import CheckBox from "@/components/CheckBox";
import { useState } from "react";
import { auth } from "../../firebase";
import RegisterHeader from "@/components/RegisterHeader";

function Permissions() {
  const [checked, setChecked] = useState(false);
  // const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  // const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const formData = {
    fn: localStorage.getItem("first_name") ?? "",
    ln: localStorage.getItem("last_name") ?? "",
    email: localStorage.getItem("email") ?? "",
    // pw: localStorage.getItem("pw") ?? "",
    username: localStorage.getItem("username") ?? "",
    phone: localStorage.getItem("contact") ?? "",
    loc: localStorage.getItem("brgy") ?? "",
    firebase_uid: localStorage.getItem("firebaseUser") ?? "",
  };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    console.log("FORM DATA:", formData);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.fn,
          last_name: formData.ln,
          phone: formData.phone,
          location_id: Number(formData.loc),
          firebase_uid: localStorage.getItem("firebaseUser"),
        }),
      });
      const result = await response.json();

      console.log("REGISTER RESULT:", result);

      if (!response.ok) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          await firebaseUser.delete();
        }
        throw new Error(result.message || "Registration failed");
      }
      localStorage.clear();
      navigate("/Registration/Finish");
    } catch (err: string | any) {
      setError(err.message || "An error occurred during registration");
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <RegisterHeader />
        <div className="h-full flex justify-evenly flex-col">
          <div className="h-1/2 flex justify-evenly flex-col">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Lastly, we would like to ask for your permission...
            </h1>
          </div>

          <div className="h-full flex justify-between flex-col">
            <div className="flex flex-col gap-8">
              <Switch
                label="Location"
                description="Your location will be needed be able to guide you to your nearest evacuation center, as well as help you provide and gain information as accurately as possible."
                id="Permissions_LocSwitch"
              />
              <Switch
                label="Camera"
                description="Posting a photo alongside marking a pin or commenting would greatly support the validity of your information. It is highly recommended to allow camera permissions to allow the full experience."
                id="Permissions_CamSwitch"
              />
            </div>
            <div>
              <CheckBox
                text="I agree to the Terms and Conditions of eLikas. This field is required."
                id="Permissions_TermsChckbox"
                checked={checked}
                onCheckedChange={(val) => {
                  setChecked(!!val);
                }}
              />
              <p className="text-xs pt-4" style={{ color: colors.label }}>
                Read the{" "}
                <a href="" className="underline" id="Permissions_TermsOpen">
                  Terms and Conditions
                </a>{" "}
                here.
              </p>
            </div>
            <form
              id="Permissions_Form"
              onSubmit={handleSubmit}
              className="w-full flex flex-col justify-center items-center m-0"
            >
              <p className="text-xs text-red-500">{error}</p>
              {!checked ? (
                <ButtonComp
                  text="Next"
                  variant="primary"
                  id="Permissions_SubmitBtn"
                  isDisabled={!checked}
                  type="submit"
                  heightSize="38px"
                  widthSize="100%"
                ></ButtonComp>
              ) : (
                <ButtonComp
                  text="Next"
                  variant="primary"
                  id="Permissions_SubmitBtn"
                  isDisabled={!checked}
                  onClick={() => handleSubmit}
                  type="submit"
                  heightSize="38px"
                  widthSize="100%"
                ></ButtonComp>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Permissions;
