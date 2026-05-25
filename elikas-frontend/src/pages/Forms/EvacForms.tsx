import ButtonComp from "@/components/Button";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";
import { MapClickHandler } from "@/lib/mapUtils";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useLocation, useNavigate } from "react-router";
import MultiSelect from "@/components/MultiSelect";
import CheckBox from "@/components/CheckBox";
import {
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Camera } from "lucide-react";

function EvacPin() {
  const [existingPin, setExistingPin] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState<undefined | string>();
  const [locationType, setLocationType] = useState("");
  const [pinName, setPinName] = useState("");
  const [blkLot, setBlkLot] = useState<string>();
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState<string | undefined>();
  const [capacity, setCapacity] = useState("");
  const [address, setAddress] = useState("");
  const [other, setOther] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [safetyCheck, setSafetyCheck] = useState(false);
  const [infoCheck, setInfoCheck] = useState(false);
  const [regFlood, setRegFlood] = useState(false);
  const [heavyFlood, setHeavyFlood] = useState(false);
  const [hasAccom, setHasAccom] = useState(false);
  const [hasDRRMO, setHasDRRMO] = useState(false);
  const [hasHealth, setHasHealth] = useState(false);
  const [pwdFriendly, setPWDFriendly] = useState(false);
  const [hasCatchment, setHasCatchment] = useState(false);
  const [toilet, setToilet] = useState("");
  const [kitchen, setKicthen] = useState("");
  const [childPrayer, setChildPrayer] = useState("");
  const [breastfeed, setBreastfeed] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const capacityCount = Number(capacity);
  const toiletCount = Number(toilet);
  const kitchenCount = Number(kitchen);
  const childPrayerCount = Number(childPrayer);
  const breastfeedCount = Number(breastfeed);

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

    console.log("locationPoint", center);
    console.log("locationType", locationType);
    console.log("address", fullAddress);
    console.log("EvacDescription", desc);
    console.log("pinName", pinName);
    console.log("Capacity", capacityCount);
    console.log("forRegularFlood", regFlood);
    console.log("forHeavyFlood", heavyFlood);
    console.log("hasAccomodation", hasAccom);
    console.log("toiletCount", toiletCount);
    console.log("kitchenCount", kitchenCount);
    console.log("hasDRRMO", hasDRRMO);
    console.log("hasHealthStation", hasHealth);
    console.log("pwdFriendly", pwdFriendly);
    console.log("hasCatchment", hasCatchment);
    console.log("Child and PrayerArea", childPrayerCount);
    console.log("breastfeedCount", breastfeedCount);
    console.log("Other Facilities", other);
    console.log("contactPerson", contactPerson);
    console.log("contactNumber", contactNumber);

    console.log("Media: TBA");

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
        id="EvacPin_Form"
        onSubmit={handleSubmit}
        className="w-full flex flex-col justify-center items-center m-0"
      >
        <div className="w-full max-w-md flex flex-col gap-5">
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Check what applies
            </FieldLabel>
            <div className="flex gap-4">
              <CheckBox
                text="for Regular Flooding"
                id="EvacPin_isRegChckbox"
                checked={regFlood}
                onCheckedChange={setRegFlood}
              />
              <CheckBox
                text="for Heavy Flooding"
                id="EvacPin_isHeavyChckbox"
                checked={heavyFlood}
                onCheckedChange={setHeavyFlood}
              />
            </div>
          </Field>
          <div className="flex flex-col gap-3">
            {/* To test when PWA is done */}
            <TextField
              label="Location Image*"
              inputType="file"
              id="EvacPin_PhotoField"
              onSubmit={fileOnChange}
              ref={inputRef}
              accept="image/png, image/jpeg, image/heic"
              endIcon={Camera}
            />
            {fileName && (
              <>
                <img src={imagePreview} />{" "}
                <ButtonComp
                  text="Clear"
                  variant="outline"
                  id="EvacPin_ImageClearBtn"
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
            id="EvacPin_LocTypeField"
            onSubmit={(e) => setLocationType(e.target.value)}
            options={[{ label: "Private Residence (My Home)", value: "1" }]}
            isRequired
          />
          <TextField
            label="Pin Name*"
            inputType="text"
            id="EvacPin_PinNameField"
            placeholder={existingPin ? "Gamoras" : "Enter your last name"}
            onSubmit={(e) => setPinName(e.target.value)}
            isRequired
          />
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Description (Optional)
            </FieldLabel>
            <InputGroupTextarea
              className="h-10 border rounded-lg text-xs"
              id="EvacPin_DescField"
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>
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
              id="EvacPin_MapContainer"
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
            <TextField
              label="Block and Lot"
              placeholder="Blk # Lot #"
              id="EvacPin_BlkLotField"
              inputType="text"
              onSubmit={(e) => setBlkLot(e.target.value)}
            ></TextField>
            <TextField
              label="House Number"
              placeholder="i.e. 111"
              id="EvacPin_HouseNumberField"
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
              id="EvacPin_StreetField"
            ></Textarea>
          </Field>
          <SelectDropdown
            value={capacity}
            onValueChange={setCapacity}
            label="Capacity Level*"
            placeholder="Select the capacity level"
            id="EvacPin_CapacityField"
            onSubmit={(e) => setLocationType(e.target.value)}
            options={[
              { label: "1 - 1-49 individuals", value: "1" },
              { label: "2 - 50-99 individuals", value: "2" },
            ]}
            isRequired
          />
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Facilities Available{" "}
            </FieldLabel>
            <FieldDescription>Check what applies</FieldDescription>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-6">
                  <CheckBox
                    text="Accomodation"
                    id="EvacPin_AccomodationChckbox"
                    checked={hasAccom}
                    onCheckedChange={() => setHasAccom(!hasAccom)}
                  />
                  <CheckBox
                    text="DRRMO Office"
                    id="EvacPin_DRRMOChckbox"
                    checked={hasDRRMO}
                    onCheckedChange={() => setHasDRRMO(!hasDRRMO)}
                  />
                </div>
                <div className="flex gap-6">
                  <CheckBox
                    text="Health Station"
                    id="EvacPin_HealthChckbox"
                    checked={hasHealth}
                    onCheckedChange={() => setHasHealth(!hasHealth)}
                  />
                  <CheckBox
                    text="PWD Friendly"
                    id="EvacPin_PWDChckbox"
                    checked={pwdFriendly}
                    onCheckedChange={() => setPWDFriendly(!pwdFriendly)}
                  />
                </div>
                <div className="flex gap-4">
                  <CheckBox
                    text="Rainwater Catchment Facility"
                    id="EvacPin_RainCatchChckbox"
                    checked={hasCatchment}
                    onCheckedChange={() => setHasCatchment(!hasCatchment)}
                  />
                </div>
              </div>
              <div className="flex gap-4 flex-col">
                <TextField
                  label="Number of Toilets (optional)"
                  placeholder="i.e. 2"
                  id="EvacPin_ToiletField"
                  inputType="number"
                  onSubmit={(e) => setToilet(e.target.value)}
                />
                <TextField
                  label="Number of Kitchens (optional)"
                  placeholder="i.e. 2"
                  id="EvacPin_KitchenField"
                  inputType="number"
                  onSubmit={(e) => setKicthen(e.target.value)}
                />
                <TextField
                  label="Number of Prayer Areas/Child-friendly areas (optional)"
                  placeholder="i.e. 2"
                  id="EvacPin_PrayerChildField"
                  inputType="number"
                  onSubmit={(e) => setChildPrayer(e.target.value)}
                />
                <TextField
                  label="Number of Breastfeeding areas (optional)"
                  placeholder="i.e. 2"
                  id="EvacPin_BreastfeedField"
                  inputType="number"
                  onSubmit={(e) => setBreastfeed(e.target.value)}
                />
              </div>
            </div>
          </Field>
          <TextField
            label="Other Facilities (optional)"
            placeholder="Enter other facilities available"
            id="EvacPin_OtherFacilitiesField"
            inputType="text"
            onSubmit={(e) => setOther(e.target.value)}
          ></TextField>
          <TextField
            label="Contact Person*"
            placeholder="Enter the person to contact for this pin"
            id="EvacPin_ContactPersonField"
            inputType="text"
            onSubmit={(e) => setContactPerson(e.target.value)}
            isRequired
          ></TextField>
          <TextField
            label="Contact Number*"
            placeholder="Enter the contact number for this pin"
            id="EvacPin_ContactNumberField"
            inputType="text"
            onSubmit={(e) => setContactNumber(e.target.value)}
            isRequired
          ></TextField>
          {existingPin ? (
            <>
              <div className="mx-2 flex justify-evenly shrink gap-4">
                <ButtonComp
                  text="Update"
                  id="EvacPin_UpdatePinBtn"
                  variant="primary"
                  heightSize="38px"
                  widthSize="20"
                ></ButtonComp>
                <ButtonComp
                  text="Close"
                  id="EvacPin_ClosePinBtn"
                  variant="important"
                  heightSize="38px"
                  widthSize="20"
                ></ButtonComp>
              </div>
            </>
          ) : (
            <>
              <div>
                <CheckBox
                  text="I confirm that this location is safe for temporary 
evacuation use."
                  id="EvacPin_SafetyCheck"
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
                  id="EvacPin_InfoCheck"
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
                  id="EvacPin_SubmitBtn"
                  isDisabled={!safetyCheck || !infoCheck}
                />
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default EvacPin;
