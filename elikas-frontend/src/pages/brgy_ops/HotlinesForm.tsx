import colors from "@/constants/colors";
import { Field } from "@/components/ui/field";
import CheckBox from "@/components/CheckBox";
import TextField from "@/components/TextField";
import { useState } from "react";
import ButtonComp from "@/components/Button";

function HotlinesForm() {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [ofNumber, setOfNumber] = useState("");
  const [secNumber, setSecNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [infoCheck, setInfoCheck] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Title", title);
    console.log("Address", address);
    console.log("Official Number", ofNumber);
    console.log("Second Number", secNumber);
    console.log("Landmark", landmark);
    console.log("Checkbox", infoCheck);
  };

  return (
    <div className="w-full h-full flex flex-col items-center ">
      <div className="w-full max-w-md pt-12 p-6 mt-8 mb-2 flex flex-col gap-4 items-center">
        <div>
          <p
            className="font-bold text-lg text-center"
            style={{ color: colors.heading }}
          >
            Add a Hotline
          </p>
          <p
            className="text-align text-center italic text-sm"
            style={{ color: colors.label }}
          >
            Hotlines added will be accessible by all users.
          </p>
        </div>
        <form
          id="Hotline_Form"
          onSubmit={handleSubmit}
          className="w-full flex flex-col justify-center items-center m-0"
        >
          <div className="w-full max-w-md flex flex-col gap-5">
            <TextField
              label="Hotline Name*"
              description="Enter where the hotline belongs to."
              inputType="text"
              id="Hotline_NameField"
              placeholder="i.e. Medical and Health"
              onSubmit={(e) => setTitle(e.target.value)}
              isRequired
            />
            <Field>
              <TextField
                label="Address*"
                description="Enter the hotline's address if applicable."
                placeholder="Blk # Lot #, Street, Barangay, City"
                id="Hotline_AddressField"
                inputType="text"
                onSubmit={(e) => setAddress(e.target.value)}
                isRequired
              ></TextField>
            </Field>
            <TextField
              label="Official Contact Number*"
              description="This will be the number the citizens will copy."
              placeholder="Enter official phone number"
              id="Hotline_OfficialNumberField"
              inputType="number"
              onSubmit={(e) => setOfNumber(e.target.value)}
              isRequired
            ></TextField>
            <TextField
              label="Second Contact Number (optional)"
              description="This will be the number citizens will use in case the official number is unreachable."
              placeholder="Enter second phone number"
              id="Hotline_SecondNumberField"
              inputType="number"
              onSubmit={(e) => setSecNumber(e.target.value)}
            ></TextField>
            <TextField
              label="Landmark (optional)"
              description="This can help citizens find this hotline's office."
              placeholder="Enter the landmark for this hotline"
              id="Hotline_LandmarkField"
              inputType="text"
              onSubmit={(e) => setLandmark(e.target.value)}
            ></TextField>
            <div>
              <CheckBox
                text="I confirm that this location is safe for temporary 
evacuation use."
                id="Hotline_InfoChckbox"
                checked={infoCheck}
                onCheckedChange={(val) => {
                  setInfoCheck(!!val);
                }}
              />
            </div>
            <div className="w-full max-w-md flex justify-center">
              <ButtonComp
                text="Create Pin"
                variant="primary"
                id="Hotline_SubmitBtn"
                isDisabled={!infoCheck}
                heightSize="38px"
                widthSize="100%"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HotlinesForm;
