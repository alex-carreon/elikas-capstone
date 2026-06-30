import { useNavigate } from "react-router";
import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import CheckBox from "@/components/CheckBox";
import { useState } from "react";
import { auth } from "../../firebase";
import { Link } from "react-router";
import { toast } from "sonner";
import { createUserWithEmailAndPassword } from "firebase/auth";
import api from "@/api";
import { ArrowLeftIcon } from "lucide-react";
import Logo from "@/components/Logo";

function Permissions() {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [toForm, setToForm] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = {
      fn: localStorage.getItem("first_name") ?? "",
      ln: localStorage.getItem("last_name") ?? "",
      email: localStorage.getItem("email") ?? "",
      pw: localStorage.getItem("pw") ?? "",
      username: localStorage.getItem("username") ?? "",
      phone: localStorage.getItem("contact") ?? "",
      loc: localStorage.getItem("brgy") ?? "",
      firebase_uid: localStorage.getItem("firebaseUser") ?? "",
      avatarSeed: localStorage.getItem("avatarSeed"),
    };

    try {
      setDisabled(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.pw,
      );

      const firebaseUser = userCredential.user;

      localStorage.setItem("firebaseUser", firebaseUser.uid);

      await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        first_name: formData.fn,
        last_name: formData.ln,
        phone: formData.phone,
        location_id: Number(formData.loc),
        firebase_uid: localStorage.getItem("firebaseUser"),
        avatar_seed: formData.avatarSeed,
      });

      toast.success("One last step!");
      navigate("/Registration/Verify");
    } catch (err: string | any) {
      console.error("Firebase error message:", err.message);

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (deleteErr) {
          console.log("Failed to delete: ", deleteErr);
        }
      }
      if (
        err.response?.data?.message === "The username has already been taken."
      ) {
        toast.error("This username has already been taken.");
      } else if (err.message === "auth/password-does-not-meet-requirements") {
        toast.error(
          "Your password must have at least 1 uppercase, 1 lowercase, 1 special character, and 1 number. Please go back and try again",
        );
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already in use.");
        setDisabled(false);
        return;
      } else if (
        err.response.data.errors.phone[0] ===
        "The phone has already been taken."
      ) {
        toast.error("This phone has already been taken.");
        return;
      } else {
        toast.error("Registration failed. Please try again.");
        navigate("/Login");
      }
      setToForm(true);
      setDisabled(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <div className="mb-6">
          <Link to="/Registration/Form" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>
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
                  We recommend <b>turning on your device's location</b>! The
                  map's features such as routing and finding the nearest
                  evacuation center centers on your location.
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
                  We recommend <b>allowing access to your files</b> for
                  attaching images to your comments on evacuation and flood
                  pins.
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
              className="w-full flex flex-col justify-center items-center m-0 gap-2"
            >
              <p className="text-xs text-red-500">{error}</p>
              {!checked ? (
                <ButtonComp
                  text="Register"
                  variant="primary"
                  id="Permissions_SubmitBtn"
                  isDisabled={!checked}
                  type="submit"
                  heightSize="38px"
                  widthSize="100%"
                ></ButtonComp>
              ) : (
                <ButtonComp
                  text="Register"
                  variant="primary"
                  id="Permissions_SubmitBtn"
                  isDisabled={!checked || disabled}
                  onClick={() => handleSubmit}
                  type="submit"
                  heightSize="38px"
                  widthSize="100%"
                ></ButtonComp>
              )}
              {toForm && (
                <ButtonComp
                  text="Back to Form"
                  variant="outline"
                  id="Permissions_FormBackBtn"
                  onClick={() => navigate("/Registration/Form")}
                  type="button"
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
