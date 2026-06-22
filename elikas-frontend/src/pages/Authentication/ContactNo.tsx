import ButtonComp from "@/components/Button";
import Logo from "@/components/Logo";
import TextField from "@/components/TextField";
import colors from "@/constants/colors";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

function ContactNo() {
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState({ contact: "" });

  const contactValidate = /^639\d{9}$/;
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(contact);

    if (!contactValidate.test(contact)) {
      setErrors({
        contact: "Invalid Contact Number",
      });
    } else {
      setErrors({
        contact: "",
      });
      localStorage.setItem("contact", contact);
      navigate("/Registration/CustomProfile");
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
        <div className="h-full flex justify-between flex-col">
          <form
            id="ContactNumber_Form"
            onSubmit={handleSubmit}
            className="h-full flex justify-between flex-col mt-8"
          >
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
                  id="ContactNumber_Field"
                  onSubmit={(e) => setContact(e.target.value)}
                  isRequired
                  error={errors.contact}
                />
              </div>
            </div>
            <div className="w-full flex justify-center items-center m-0 flex-col gap-2">
              {/* <Link to="/Registration/Verify" className="w-full max-w-xs"> */}
              <ButtonComp
                text="Next"
                variant="primary"
                id="ContactNumber_FormSubmitBtn"
                type="submit"
                heightSize="38px"
                widthSize="100%"
              ></ButtonComp>
              {/* </Link> */}
              <Link
                to="/Registration/CustomProfile"
                className="w-full max-w-xs"
              >
                <ButtonComp
                  text="Skip"
                  variant="outline"
                  id="ContactNumber_Skip"
                  heightSize="38px"
                  widthSize="100%"
                ></ButtonComp>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactNo;
