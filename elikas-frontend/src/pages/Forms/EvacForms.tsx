import ButtonComp from "@/components/Button";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroupInput, InputGroup } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";
import { MapClickHandler } from "@/lib/mapUtils";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useLocation, useNavigate } from "react-router";
import MultiSelect from "@/components/MultiSelect";
import CheckBox from "@/components/CheckBox";

function EvacForm() {
  const [existingPin, setExistingPin] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState<undefined | string>();
  const [locationType, setLocationType] = useState("");
  const [pinName, setPinName] = useState("");
  const [blkLot, setBlkLot] = useState<string>();
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState<string | undefined>();
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [safetyCheck, setSafetyCheck] = useState(false);
  const [infoCheck, setInfoCheck] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (location.state?.from === "/History") {
      setExistingPin(true);
    }
  }, [[location.state?.from]]);

  const fileOnChange = (e: any) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setFileName("");

    if (inputRef.current) {
      console.log(inputRef.current);
      inputRef.current.value = "";
    }
  };

  // parse clickedPin from mapUtils MapClickHandler to a number array
  const rawLoc = localStorage.getItem("clickedPin");
  const clickedLoc: [number, number] | null = rawLoc
    ? JSON.parse(rawLoc)
    : null;
  const center: [number, number] = clickedLoc ?? [14.5995, 120.9842];

  const description = localStorage.getItem("LocDescription") ?? undefined;

  useEffect(() => {
    setStreet(description);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    var fullAddress = "";

    if (blkLot || !houseNo) {
      fullAddress = `${blkLot} ${street}`;
    } else if (houseNo || blkLot) {
      fullAddress = `${houseNo} ${street}`;
    } else fullAddress = `${street}`;

    setAddress(fullAddress);

    console.log("locationType", locationType);
    console.log("pinName", pinName);
    console.log("address", fullAddress);
    console.log("contactPerson", contactPerson);
    console.log("contactNumber", contactNumber);

    // File not sure yet - localStorage.setItem("fileName", last_name);
    // Facilities not sure as well
    localStorage.setItem("locationType", locationType);
    localStorage.setItem("pinName", pinName);
    localStorage.setItem("address", fullAddress);
    localStorage.setItem("contactPerson", contactPerson);
    localStorage.setItem("contactNumber", contactNumber);

    navigate("/Map");
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
      <div>
        <p
          className="font-bold text-lg text-center"
          style={{ color: colors.heading }}
        >
          {existingPin
            ? "Evacuation Pin Details"
            : "Register an Evacuation Location"}
        </p>
        {existingPin ? null : (
          <p
            className="text-align italic text-sm"
            style={{ color: colors.label }}
          >
            Help others find safe temporary shelter.
          </p>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col justify-center items-center m-0"
      >
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <TextField
              label="Location Image*"
              inputType="file"
              id="EvacPin_PhotoField"
              onSubmit={fileOnChange}
              ref={inputRef}
            />
            {fileName && (
              <>
                <img src={imagePreview} />{" "}
                <ButtonComp
                  text="Clear"
                  variant="outline"
                  id="EvacForm_ImageClearBtn"
                  onClick={handleClearImage}
                ></ButtonComp>
              </>
            )}
          </div>
          <SelectDropdown
            value={locationType}
            onValueChange={setLocationType}
            label="Location Type*"
            placeholder="Select the location type"
            id="EvacForm_LocTypeField"
            onSubmit={(e) => setLocationType(e.target.value)}
            options={[{ label: "Private Residence (My Home)", value: "1" }]}
            isRequired
          />
          <TextField
            label="Pin Name*"
            inputType="text"
            id="EvacForm_PinNameField"
            placeholder={existingPin ? "Gamoras" : "Enter your last name"}
            onSubmit={(e) => setPinName(e.target.value)}
            isRequired
          />
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Chosen Location
            </FieldLabel>
            <FieldDescription>
              If you change your mind, please go back to the map and try again.
            </FieldDescription>
            {/* {localStorage.getItem("LocDescription")} */}
            <TextField
              label="Block and Lot"
              placeholder="Blk # Lot #"
              id="EvacForm_BlkLotField"
              inputType="text"
              onSubmit={(e) => setBlkLot(e.target.value)}
            ></TextField>
            <TextField
              label="House Number"
              placeholder="i.e. 111"
              id="EvacForm_HouseNumberField"
              inputType="text"
              onSubmit={(e) => setHouseNo(e.target.value)}
            ></TextField>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Street
            </FieldLabel>
            <Textarea
              readOnly
              placeholder={description}
              id="EvacForm_StreetField"
            ></Textarea>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Map Location
            </FieldLabel>
            <MapContainer
              center={center}
              zoom={17}
              scrollWheelZoom={false}
              style={{ height: "30vh", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler
                onPinClick={null}
                setClickedLoc={center}
                clickedLoc={center}
              />
            </MapContainer>
          </Field>
          <TextField
            label="Contact Person*"
            placeholder="Enter the person to contact for this pin"
            id="EvacForm_ContactPersonField"
            inputType="text"
            onSubmit={(e) => setContactPerson(e.target.value)}
            isRequired
          ></TextField>
          <TextField
            label="Contact Number*"
            placeholder="Enter the contact number for this pin"
            id="EvacForm_ContactNumberField"
            inputType="text"
            onSubmit={(e) => setContactNumber(e.target.value)}
            isRequired
          ></TextField>
          <MultiSelect
            label="Facilities Available"
            items={["Accomodation", "Comfort Room"]}
          />
          <div>
            <CheckBox
              text="I confirm that this location is safe for temporary 
evacuation use."
              id="EvacForm_SafetyCheck"
              checked={safetyCheck}
              onCheckedChange={(val) => {
                setSafetyCheck(!!val);
              }}
            />
          </div>
          <div>
            <CheckBox
              text="I understand that false information may result in removal 
or account restriction."
              id="EvacForm_InfoCheck"
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
              id="EvacForm_SubmitBtn"
              isDisabled={!safetyCheck || !infoCheck}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

export default EvacForm;
