import ButtonComp from "@/components/Button";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";
import { MapClickHandler } from "@/lib/mapUtils";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useLocation, useNavigate, useParams } from "react-router";
import MultiSelect from "@/components/MultiSelect";
import CheckBox from "@/components/CheckBox";
import {
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Camera } from "lucide-react";
import { handleDelete, handleSubmit, handleUpdate } from "@/lib/evacUtils";
import { useUserContext } from "@/context/AuthContext";
import api from "@/api";
import FormSkeleton from "../Skeletons/FormSkeleton";

type EvacType = {
  id: number;
  evac_type: string;
};

type verifiedBy = {
  gov_op_id: number | null;
  username: string | null;
};

type postedBy = {
  user_id: number;
  username: string;
  posted_at: string;
};

type EvacPin = {
  id: number;
  name: string;
  address: string;
  description: string;
  lat: number;
  lng: number;
  location_id: number;
  area_type: EvacType;
  capacity_level: number;
  is_persistent: boolean;
  for_reg_flood: boolean;
  for_heavy_flood: boolean;
  has_accom: boolean;
  has_DRRMO: boolean;
  has_health: boolean;
  pwd_friendly: boolean;
  has_catchment: boolean;
  toilet_count: number;
  kitchen_count: number;
  child_prayer_count: number;
  breastfeed_count: number;
  other_facilities: string;
  contact_person: string;
  contact_number: string;
  is_deactivated: boolean;
  is_expired: boolean;
  expiry: string | null | undefined;
  deactivated_at: string | null;
  last_updated: string | null;
  verified_by: verifiedBy;
  posted_by: postedBy;
  last_confirmed: string | null;
};

function EvacPin() {
  const [existingPin, setExistingPin] = useState(false);
  const [fileName, setFileName] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<undefined | string>();
  const [locationType, setLocationType] = useState("");
  const [pinName, setPinName] = useState("");
  const [blkLot, setBlkLot] = useState<string>();
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState<string | undefined>();
  const [capacity, setCapacity] = useState("");
  const [address, setAddress] = useState("");
  const [isPersistent, setIsPersistent] = useState(false);
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
  const [hasToilet, setHasToilet] = useState(false);
  const [toilet, setToilet] = useState("");
  const [hasKitchen, setHasKitchen] = useState(false);
  const [kitchen, setKicthen] = useState("");
  const [hasChildPrayer, setHasChildPrayer] = useState(false);
  const [childPrayer, setChildPrayer] = useState("");
  const [hasBreastfeed, setHasBreastfeed] = useState(false);
  const [breastfeed, setBreastfeed] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [evacTypes, setEvacTypes] = useState<EvacType[]>([]);
  const [areaType, setAreaType] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evacPins, setEvacPins] = useState<EvacPin | undefined>();
  const [expiry, setExpiry] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const capacityCount = Number(capacity);
  const toiletCount = Number(toilet);
  const kitchenCount = Number(kitchen);
  const childPrayerCount = Number(childPrayer);
  const breastfeedCount = Number(breastfeed);

  const { role } = useUserContext();
  const { id } = useParams();

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
    setFileName(undefined);

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

  useEffect(() => {
    if (id) {
      const getEvacDetails = async () => {
        try {
          setLoading(true);
          setHasUpdated(false);
          const response = await api.get(`/pins/${id}`);
          const evacDetails = await response.data;

          setRegFlood(evacDetails.for_reg_flood);
          setHeavyFlood(evacDetails.for_heavy_flood);
          setAreaType(evacDetails.area_type);
          setPinName(evacDetails.name);
          setDesc(evacDetails.description);
          setAddress(evacDetails.address);
          setCapacity(String(evacDetails.capacity_level));
          setHasAccom(evacDetails.has_accom);
          setHasDRRMO(evacDetails.has_DRRMO);
          setHasHealth(evacDetails.has_health);
          setPWDFriendly(evacDetails.pwd_friendly);
          setHasCatchment(evacDetails.has_catchment);
          setExpiry(evacDetails.expiry);
          if (evacDetails.toilet_count) {
            setHasToilet(true);
          }
          setToilet(String(evacDetails.toilet_count));
          if (evacDetails.kitchen_count) {
            setHasKitchen(true);
          }
          setKicthen(String(evacDetails.kitchen_count));
          if (evacDetails.breastfeed_count) {
            setHasBreastfeed(true);
          }
          setChildPrayer(String(evacDetails.child_prayer_count));
          if (evacDetails.child_prayer_count) {
            setHasChildPrayer(true);
          }
          setBreastfeed(String(evacDetails.breastfeed_count));
          setOther(evacDetails.other_facilities);
          setContactPerson(evacDetails.contact_person);
          setContactNumber(evacDetails.contact_number);
          setEvacPins(evacDetails);
        } catch (err: string | any) {
          console.log(err.response.data);
        } finally {
          setLoading(false);
        }
      };
      getEvacDetails();
    } else if (!id) {
      const getAreaTypes = async () => {
        try {
          const response = await api.get("/evac-types");
          setEvacTypes(response.data);

          if (!response) {
            console.log("Failed to fetch evac types");
            return;
          }
        } catch (error: any) {
          console.error(error.response.data);
        }
      };

      getAreaTypes();
    }
  }, [hasUpdated]);

  useEffect(() => {
    console.log("evacPins:", evacPins);
    if (isEditable && evacPins) {
      setRegFlood(evacPins.for_reg_flood);
      setDesc(evacPins.description);
      setRegFlood(evacPins.for_reg_flood);
      setHeavyFlood(evacPins.for_heavy_flood);
      setAreaType(evacPins.area_type.id);
      setPinName(evacPins.name);
      setDesc(evacPins.description);
      setAddress(evacPins.address);
      // setCapacity(String(evacPins.capacity_level));
      setHasAccom(evacPins.has_accom);
      setHasDRRMO(evacPins.has_DRRMO);
      setHasHealth(evacPins.has_health);
      setPWDFriendly(evacPins.pwd_friendly);
      setHasCatchment(evacPins.has_catchment);
      console.log(evacPins.for_reg_flood);
    }
  }, [isEditable, evacPins]);

  const submit = (e: React.FormEvent) => {
    handleSubmit({
      e: e,
      name: pinName,
      address: address,
      description: desc,
      lat: center[0],
      lng: center[1],
      location_id: 1,
      area_type: areaType,
      capacity_level: capacityCount,
      is_persistent: role === "indiv" ? false : isPersistent,
      for_reg_flood: regFlood,
      for_heavy_flood: heavyFlood,
      has_accom: hasAccom,
      has_DRRMO: hasDRRMO,
      has_health: hasHealth,
      pwd_friendly: pwdFriendly,
      has_catchment: hasCatchment,
      toilet_count: toiletCount,
      kitchen_count: kitchenCount,
      child_prayer_count: childPrayerCount,
      breastfeed_count: breastfeedCount,
      other_facilities: other,
      contact_person: contactPerson,
      contact_number: contactNumber,
      expiry: null,
      file: fileName,
      navigate: navigate,
    });
  };

  const update = (e: React.FormEvent) => {
    handleUpdate({
      e: e,
      id: id,
      name: pinName,
      address: `${blkLot ?? ""} ${houseNo ?? ""} ${street ?? ""}`,
      description: desc,
      // location_id: 1,
      area_type: areaType,
      // capacity_level: capacityCount,
      is_persistent: role === "indiv" ? false : isPersistent,
      for_reg_flood: regFlood,
      for_heavy_flood: heavyFlood,
      has_accom: hasAccom,
      has_DRRMO: hasDRRMO,
      has_health: hasHealth,
      pwd_friendly: pwdFriendly,
      has_catchment: hasCatchment,
      toilet_count: toiletCount,
      kitchen_count: kitchenCount,
      child_prayer_count: childPrayerCount,
      breastfeed_count: breastfeedCount,
      other_facilities: other,
      contact_person: contactPerson,
      contact_number: contactNumber,
      expiry: null,
      setIsEditable: setIsEditable,
      setHasUpdated: setHasUpdated,
    });
  };

  const deac = () => {
    handleDelete({ id: id, navigate: navigate });
  };

  return loading ? (
    <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
      <FormSkeleton />
    </div>
  ) : (
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
      <div
        id="EvacPin_Form"
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
                readOnly={!isEditable}
              />
              <CheckBox
                text="for Heavy Flooding"
                id="EvacPin_isHeavyChckbox"
                checked={heavyFlood}
                onCheckedChange={setHeavyFlood}
                readOnly={!isEditable}
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
          {isEditable ? (
            <SelectDropdown
              value={String(areaType)}
              onValueChange={(val) => setAreaType(Number(val))}
              label="Location Type*"
              placeholder="Select the location type"
              id="EvacPin_LocTypeField"
              onSubmit={(e) => setAreaType(Number(e.target.value))}
              options={evacTypes.map((type) => ({
                label: type.evac_type,
                value: type.id.toString(),
              }))}
            />
          ) : (
            <TextField
              label="Location Type"
              value={String(evacPins?.area_type) ?? ""}
              inputType="text"
              id="EvacPin_LocType"
              readonly
            />
          )}

          <TextField
            label="Pin Name*"
            value={pinName}
            inputType="text"
            id={!id || isEditable ? "EvacPin_PinNameField" : ""}
            placeholder={existingPin ? "Gamoras" : "Enter your last name"}
            onSubmit={(e) => setPinName(e.target.value)}
            readonly={!isEditable}
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
              value={desc || ""}
              onChange={(e) => setDesc(e.target.value)}
              readOnly={!isEditable}
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
            {id && <p className="text-sm">{address}</p>}
            {!id ||
              (isEditable && (
                <>
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
                </>
              ))}
          </Field>
          {isEditable || !id ? (
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
              isRequired={id ? false : true}
            />
          ) : (
            <TextField
              label="Capacity Level"
              id="EvacPin_Capacity"
              inputType="text"
              value={capacity}
              readonly
            ></TextField>
          )}

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
                    readOnly={!isEditable}
                  />
                  <CheckBox
                    text="DRRMO Office"
                    id="EvacPin_DRRMOChckbox"
                    checked={hasDRRMO}
                    onCheckedChange={() => setHasDRRMO(!hasDRRMO)}
                    readOnly={!isEditable}
                  />
                </div>
                <div className="flex gap-6">
                  <CheckBox
                    text="Health Station"
                    id="EvacPin_HealthChckbox"
                    checked={hasHealth}
                    onCheckedChange={() => setHasHealth(!hasHealth)}
                    readOnly={!isEditable}
                  />
                  <CheckBox
                    text="PWD Friendly"
                    id="EvacPin_PWDChckbox"
                    checked={pwdFriendly}
                    onCheckedChange={() => setPWDFriendly(!pwdFriendly)}
                    readOnly={!isEditable}
                  />
                </div>
                <div className="flex gap-6">
                  <CheckBox
                    text="Toilet"
                    id="EvacPin_ToiletChckbox"
                    checked={hasToilet}
                    onCheckedChange={() => setHasToilet(!hasToilet)}
                    readOnly={!isEditable}
                  />
                  <CheckBox
                    text="Kitchen"
                    id="EvacPin_KitchenChckbox"
                    checked={hasKitchen}
                    onCheckedChange={() => setHasKitchen(!hasKitchen)}
                    readOnly={!isEditable}
                  />
                </div>
                <div className="flex gap-6">
                  <CheckBox
                    text="Child/Prayer Area"
                    id="EvacPin_ChildPrayerChckbox"
                    checked={hasChildPrayer}
                    onCheckedChange={() => setHasChildPrayer(!hasChildPrayer)}
                    readOnly={!isEditable}
                  />
                  <CheckBox
                    text="Breastfeeding Area"
                    id="EvacPin_BreastfeedChckbox"
                    checked={hasBreastfeed}
                    onCheckedChange={() => setHasBreastfeed(!hasBreastfeed)}
                    readOnly={!isEditable}
                  />
                </div>
                <div className="flex gap-4">
                  <CheckBox
                    text="Rainwater Catchment Facility"
                    id="EvacPin_RainCatchChckbox"
                    checked={hasCatchment}
                    onCheckedChange={() => setHasCatchment(!hasCatchment)}
                    readOnly={!isEditable}
                  />
                </div>
              </div>
              <div className="flex gap-4 flex-col">
                {hasToilet && (
                  <TextField
                    label="Number of Toilets (optional)"
                    placeholder={!id || isEditable ? "i.e. 2" : ""}
                    id="EvacPin_ToiletField"
                    inputType="number"
                    onSubmit={(e) => setToilet(e.target.value)}
                    value={toilet}
                  />
                )}
                {hasKitchen && (
                  <TextField
                    label="Number of Kitchens (optional)"
                    placeholder={!id || isEditable ? "i.e. 2" : ""}
                    id="EvacPin_KitchenField"
                    inputType="number"
                    onSubmit={(e) => setKicthen(e.target.value)}
                    value={kitchen}
                  />
                )}
                {hasChildPrayer && (
                  <TextField
                    label="Number of Prayer Areas/Child-friendly areas (optional)"
                    placeholder={!id || isEditable ? "i.e. 2" : ""}
                    id="EvacPin_PrayerChildField"
                    inputType="number"
                    onSubmit={(e) => setChildPrayer(e.target.value)}
                    value={childPrayer}
                  />
                )}
                {hasBreastfeed && (
                  <TextField
                    label="Number of Breastfeeding areas (optional)"
                    placeholder={!id || isEditable ? "i.e. 2" : ""}
                    id="EvacPin_BreastfeedField"
                    inputType="number"
                    onSubmit={(e) => setBreastfeed(e.target.value)}
                    value={breastfeed}
                  />
                )}
              </div>
            </div>
          </Field>
          <TextField
            label="Other Facilities (optional)"
            placeholder={
              !id || isEditable ? "Enter other facilities available" : ""
            }
            id="EvacPin_OtherFacilitiesField"
            inputType="text"
            onSubmit={(e) => setOther(e.target.value)}
            value={other || ""}
          ></TextField>
          <TextField
            label="Contact Person*"
            placeholder="Enter the person to contact for this pin"
            id="EvacPin_ContactPersonField"
            inputType="text"
            onSubmit={(e) => setContactPerson(e.target.value)}
            value={contactPerson}
            readonly={!isEditable}
          ></TextField>
          <TextField
            label="Contact Number*"
            placeholder={
              !id || isEditable ? "Enter the contact number for this pin" : ""
            }
            id="EvacPin_ContactNumberField"
            inputType="text"
            onSubmit={(e) => setContactNumber(e.target.value)}
            value={contactNumber}
            readonly={!isEditable}
          ></TextField>
          <TextField
            label="Expiration Date*"
            placeholder={
              !id || isEditable ? "Enter the expiry date for this pin" : ""
            }
            id="EvacPin_ExpiryField"
            inputType="text"
            onSubmit={(e) => setExpiry(e.target.value)}
            value={expiry}
            readonly={!isEditable}
          ></TextField>
          {id ? (
            !isEditable ? (
              <>
                <div className="mx-2 flex justify-evenly shrink gap-4">
                  <ButtonComp
                    text="Update"
                    id="EvacPin_UpdatePinBtn"
                    variant="primary"
                    heightSize="38px"
                    widthSize="20"
                    onClick={() => setIsEditable(true)}
                    type="button"
                  ></ButtonComp>
                  <ButtonComp
                    text="Close"
                    id="EvacPin_ClosePinBtn"
                    variant="important"
                    heightSize="38px"
                    widthSize="20"
                    type="button"
                    onClick={() => deac()}
                  ></ButtonComp>
                </div>
              </>
            ) : (
              <>
                <div className="mx-2 flex justify-evenly shrink gap-4">
                  <ButtonComp
                    text="Submit"
                    id="EvacPin_SubmitUpdBtn"
                    // type="button"
                    variant="primary"
                    heightSize="38px"
                    widthSize="20"
                    onClick={(e) => update(e)}
                  ></ButtonComp>
                  <ButtonComp
                    text="Cancel"
                    id="EvacPin_CancelUpdBtn"
                    variant="outline"
                    heightSize="38px"
                    widthSize="20"
                    onClick={() => {
                      setIsEditable(false);
                    }}
                    type="button"
                  ></ButtonComp>
                </div>
              </>
            )
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
                  heightSize="38px"
                  widthSize="100%"
                  onClick={(e) => submit(e)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EvacPin;
