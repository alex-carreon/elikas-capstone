import { useNavigate } from "react-router";
import colors from "@/constants/colors";
import Switch from "@/components/Switch";
import ButtonComp from "@/components/Button";
import CheckBox from "@/components/CheckBox";
import { useState } from "react";
import { auth } from "../../firebase";
import RegisterHeader from "@/components/RegisterHeader";
import { Link } from "react-router";
import { toast } from "sonner";

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
    avatarSeed: localStorage.getItem("avatarSeed"),
  };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    console.log("FORM DATA:", formData);

    try {
      const registerPromise = new Promise(async (resolve, reject) => {
        const response = await fetch(
          "http://127.0.0.1:8000/api/auth/register",
          {
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
              avatar_seed: formData.avatarSeed,
            }),
          },
        );
        const result = await response.json();

        console.log("REGISTER RESULT:", result);

        if (!response.ok) {
          const firebaseUser = auth.currentUser;
          if (firebaseUser) {
            await firebaseUser.delete();
          }
          reject(setError(result.message));
          navigate("/Login");
          throw new Error(result.message || "Registration failed");
        } else {
          resolve(result);
        }
        localStorage.clear();
      });

      toast.promise(registerPromise, {
        loading: "Processing...",
        success: "You are registered!",
        position: "top-center",
      });

      registerPromise.then(() => {
        navigate("/Registration/Finish");
      });
    } catch (err: string | any) {
      setError(err.message || "An error occurred during registration");
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <RegisterHeader />
        <div className="h-full flex justify-evenly flex-col">
          <div className="h-1/2 flex gap-2 justify-center flex-col">
            <h1
              className="BeVietnamPro text-2xl text-center font-bold m-0"
              style={{ color: colors.heading }}
            >
              A few reminders before getting started
            </h1>
            <p
              className="text-sm text-center p-1"
              style={{ color: colors.heading }}
            >
              The actions below are <b>optional</b>, but are recommended to gain
              the full experience
            </p>
          </div>

          <div className="h-full flex justify-between flex-col">
            <div className="flex flex-col gap-8">
              <div>
                <p
                  className="text-xl font-bold"
                  style={{ color: colors.activeIcon }}
                >
                  Location
                </p>
                <p className="text-sm" style={{ color: colors.heading }}>
                  It is recommended to <b>turn on your device's location</b>!
                  This is needed for the map's features such as routing and
                  finding the nearest evacuation center to work.
                </p>
              </div>
              <div>
                <p
                  className="text-xl font-bold"
                  style={{ color: colors.activeIcon }}
                >
                  Files Access
                </p>
                <p className="text-sm" style={{ color: colors.heading }}>
                  It is recommended to <b>allow access to your files</b> so that
                  you may attach images to your comments on evacuation and flood
                  pins. This will help your fellow neighbors gauge their safety!
                </p>
              </div>
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
              <div
                className="flex flex-row text-xs pt-4 gap-1"
                style={{ color: colors.label }}
              >
                <p>Read the</p>
                <Link to="/TermsConditions">
                  <p className="underline" id="Permissions_TermsOpen">
                    Terms and Conditions
                  </p>
                </Link>
                <p>here.</p>
              </div>
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
