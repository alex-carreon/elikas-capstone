import { useState, useEffect } from "react";
import FormLayout from "@/pages/Admin/Forms/FormLayout";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { useNavigate, useParams } from "react-router";
import api from "@/api";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import colors from "@/constants/colors";
import CheckBox from "@/components/CheckBox";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { InputGroupTextarea } from "@/components/ui/input-group";
import { MapContainer, TileLayer } from "react-leaflet";
import { MapClickHandler } from "@/lib/mapUtils";
import DatePickerInput from "@/components/DateField";
import ButtonComp from "@/components/Button";
import { toast } from "sonner";
import AlertDialogue from "@/components/AlertDialogue";
import { toZonedTime, format } from "date-fns-tz";
import {
  handleUpdate,
  handleReOpen,
  handleDelete,
  handleReactivate,
} from "@/lib/evacUtils";
import { addDays } from "date-fns";

type EvacType = {
  id: number;
  evac_type: string;
};

type CapacityLevel = {
  id: number;
  capacity_level: string;
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

type media = {
  id: number;
  type: string;
  url: File;
};

type EvacPin = {
  id: number;
  media: media[];
  name: string;
  address: string;
  description: string;
  lat: number;
  lng: number;
  location_id: number;
  area_type_id: number;
  area_type: string;
  capacity_level_id: number;
  capacity_name: string;
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
  expiry: Date;
  deactivated_at: string | null;
  last_updated: string | null;
  verified_by: verifiedBy;
  posted_by: postedBy;
  last_confirmed: string | null;
  coordinates: [number, number];
};

function EvacDetails() {
  const [loading, setLoading] = useState(false);
  const [pinDetails, setPinDetails] = useState<EvacPin>();
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
  const [evacTypes, setEvacTypes] = useState<EvacType[]>([]);
  const [areaType, setAreaType] = useState(0);
  const [pinName, setPinName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isFull, setIsFull] = useState(false);
  const [expiry, setExpiry] = useState<Date | undefined>();
  const [isExpired, setIsExpired] = useState(false);
  const [other, setOther] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isPersistent, setIsPersistent] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [capacityLevels, setCapacityLevels] = useState<CapacityLevel[]>([]);
  const [willOpen, setWillOpen] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [willReopen, setWillReopen] = useState(false);

  const capacityCount = Number(capacity);
  const toiletCount = Number(toilet);
  const kitchenCount = Number(kitchen);
  const childPrayerCount = Number(childPrayer);
  const breastfeedCount = Number(breastfeed);

  const navigate = useNavigate();

  const { id } = useParams();

  const getEvacDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/pins/${id}`, { signal });
      const evacDetails = await response.data;

      setRegFlood(evacDetails.for_reg_flood);
      setHeavyFlood(evacDetails.for_heavy_flood);
      setAreaType(evacDetails.area_type);
      setPinName(evacDetails.name);
      setDesc(evacDetails.description);
      setAddress(evacDetails.address);
      setCapacity(String(evacDetails.capacity_level));
      setIsFull(evacDetails.capacity_name === "Full");
      setHasAccom(evacDetails.has_accom);
      setHasDRRMO(evacDetails.has_DRRMO);
      setHasHealth(evacDetails.has_health);
      setPWDFriendly(evacDetails.pwd_friendly);
      setHasCatchment(evacDetails.has_catchment);
      setExpiry(evacDetails.expiry);
      setIsExpired(evacDetails.is_expired);
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
      setIsPersistent(evacDetails.is_persistent);
      setPinDetails(evacDetails);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getAreaTypes = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/evac-types", { signal });
      setEvacTypes(response.data);

      if (!response) {
        console.log("Failed to fetch evac types");
        return;
      }
    } catch (error: any) {
      console.error(error.response.data);
    }
  };

  const getCapacityLevels = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/capacity-levels", { signal });
      setCapacityLevels(response.data);
    } catch (error: any) {
      console.error(error.response.data);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await Promise.all([
        getEvacDetails(controller.signal),
        getCapacityLevels(controller.signal),
      ]);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const getEditDetails = async () => {
    const controller = new AbortController();

    try {
      await Promise.all([
        getCapacityLevels(controller.signal),
        getAreaTypes(controller.signal),
      ]);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }

    return () => controller.abort();
  };

  const update = (e: React.FormEvent) => {
    handleUpdate({
      e: e,
      id: id,
      name: pinName,
      description: desc,
      area_type: areaType,
      capacity_level: Number(capacity),
      is_persistent: isPersistent,
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
      expiry: format(
        toZonedTime(expiry!, "Asia/Manila"),
        "yyyy-MM-dd HH:mm:ss",
        {
          timeZone: "Asia/Manila",
        },
      ),
      setIsEditable: setIsEditable,
      setHasUpdated: setHasUpdated,
    });
  };

  const deac = () => {
    handleDelete({ id: id, navigate: navigate, redirect: "/admin-pins" });
  };

  const markFull = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const fullLevel = capacityLevels?.find(
        (level) => level.capacity_level === "Full",
      )?.id;

      // if currently full, mark as open using selected capacity
      // if not full, mark as full using the Full level id
      const newCapacityLevel = isFull ? Number(capacity) : fullLevel;

      const response = api.put(`/pins/${id}`, {
        capacity_level: newCapacityLevel,
      });

      toast.promise(response, {
        loading: isFull ? "Marking as open..." : "Marking as full...",
        success: isFull ? "Pin marked as open!" : "Pin marked as full!",
        error: (err: any) => err.response.data,
        position: "top-center",
      });

      response.then(async () => {
        setIsFull(!isFull);
        await getEvacDetails();
      });
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  const reOpen = (e: React.FormEvent) => {
    const expDate = expiry ?? addDays(new Date(), 7);

    handleReOpen({
      e: e,
      expiry: format(
        toZonedTime(expDate!, "Asia/Manila"),
        "yyyy-MM-dd HH:mm:ss",
        {
          timeZone: "Asia/Manila",
        },
      ),
      id: id,
      navigate: navigate,
      redirect: "/admin-pins",
    });
  };

  const reactivate = (e: React.FormEvent) =>
    handleReactivate({
      e: e,
      id: id,
      navigate: navigate,
      redirect: "/admin-pins",
    });

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    if (isEditable) {
      const fetch = async () => {
        setLoading(true);
        await getEditDetails();
        setLoading(false);
      };
      fetch();
    }
  }, [isEditable]);

  useEffect(() => {
    if (isEditable && pinDetails) {
      setRegFlood(pinDetails.for_reg_flood);
      setDesc(pinDetails.description);
      setRegFlood(pinDetails.for_reg_flood);
      setHeavyFlood(pinDetails.for_heavy_flood);
      setAreaType(pinDetails.area_type_id);
      setPinName(pinDetails.name);
      setDesc(pinDetails.description);
      setAddress(pinDetails.address);
      setCapacity(String(pinDetails.capacity_level_id));
      setHasAccom(pinDetails.has_accom);
      setHasDRRMO(pinDetails.has_DRRMO);
      setHasHealth(pinDetails.has_health);
      setPWDFriendly(pinDetails.pwd_friendly);
      setHasCatchment(pinDetails.has_catchment);
    }
  }, [isEditable, pinDetails]);

  return (
    <>
      {willReopen && (
        <AlertDialogue
          contentId="EvacPin_ReopenContent"
          closeId="EvacPin_ReopenClose"
          actionId="EvacPin_ReopenBtn"
          open={willReopen}
          title="You are about to re-open this pin"
          description="Re-opening this pin add it to the map. The expiration date will default to 7 days unless specified."
          buttonText="Re-open"
          onClose={() => {
            setWillReopen(false);
          }}
          onClick={(e) => reOpen(e)}
        >
          <DatePickerInput
            label="Expiry Date"
            idField="EvacPin_ReopenExpiryField"
            idBtn="EvacPin_ReopenCalendarBtn"
            placeholder="Enter Expiration Date"
            value={expiry}
            onChange={setExpiry}
            edit
            showTime
          />
        </AlertDialogue>
      )}
      {willOpen && (
        <AlertDialogue
          contentId="EvacPin_OpenContent"
          closeId="EvacPin_OpenClose"
          actionId="EvacPin_OpenBtn"
          open={willOpen}
          title="You are about to open this pin"
          description="Opening this pin will let citizens know that this evacuation center still has space."
          buttonText="Open"
          onClose={() => {
            setWillOpen(false);
          }}
          onClick={(e) => {
            markFull(e);
            setWillOpen(!willOpen);
          }}
        >
          <SelectDropdown
            value={capacity}
            onValueChange={setCapacity}
            label="Capacity Level*"
            placeholder="Select the capacity level"
            id="EvacPin_CapacityOpenField"
            onSubmit={(e) => setCapacity(e.target.value)}
            options={capacityLevels
              ?.filter((level) => level.capacity_level !== "Full")
              .map((level) => ({
                label: level.capacity_level,
                value: String(level.id),
              }))}
            isRequired
          />
        </AlertDialogue>
      )}
      <FormLayout
        formTitle="Evacuation Pin Details"
        formId="Admin_EvacPinUpdateForm"
        isEditable={isEditable}
        updateId="Admin_EvacPinUpdBtn"
        deleteId="Admin_EvacPinDelBtn"
        submitUpdId="Admin_EvacPinSubmitUpd"
        closeUpdId="Admin_EvacPinCloseUpd"
        updateClick={() => setIsEditable(true)}
        closeUpdClick={() => {
          setIsEditable(false);
          getEvacDetails();
        }}
        deleteClick={() => deac()}
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <form
              id="Admin_EvacPinUpdateForm"
              onSubmit={(e) => update(e)}
              className="flex flex-col gap-4"
            >
              <div className="w-full max-w-md flex flex-col gap-5">
                <Field>
                  <CheckBox
                    text="Is this evacuation center persistent?"
                    id="EvacPin_isPersistentChckbox"
                    checked={isPersistent}
                    onCheckedChange={setIsPersistent}
                    readOnly={!isEditable}
                  />
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
                {pinDetails?.media[0]?.url && (
                  <img src={String(pinDetails?.media[0].url)} />
                )}
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
                    value={pinDetails?.area_type}
                    inputType="text"
                    id="EvacPin_LocType"
                    readonly
                  />
                )}
                <TextField
                  label="Pin Name*"
                  value={pinName}
                  inputType="text"
                  id="EvacPin_PinNameField"
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
                    If you change your mind, please go back to the map and try
                    again.
                  </FieldDescription>
                  {/* {localStorage.getItem("LocDescription")} */}
                  <FieldLabel
                    className={"text-sm w-s"}
                    style={{ color: colors.label }}
                  >
                    Map Location
                  </FieldLabel>
                  <MapContainer
                    center={pinDetails?.coordinates}
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
                      setClickedLoc={pinDetails?.coordinates}
                      clickedLoc={pinDetails?.coordinates}
                    />
                  </MapContainer>
                  <p className="text-sm">{address}</p>
                </Field>
                {isEditable || !id ? (
                  <SelectDropdown
                    value={capacity}
                    onValueChange={setCapacity}
                    label="Capacity Level*"
                    placeholder="Select the capacity level"
                    id="EvacPin_CapacityField"
                    onSubmit={(e) => setCapacity(e.target.value)}
                    options={capacityLevels
                      ?.filter((level) => level.capacity_level !== "Full")
                      .map((level) => ({
                        label: level.capacity_level,
                        value: String(level.id),
                      }))}
                  />
                ) : (
                  <TextField
                    label="Capacity Level"
                    id="EvacPin_Capacity"
                    inputType="text"
                    value={pinDetails?.capacity_name}
                    readonly
                  ></TextField>
                )}

                <Field>
                  <FieldLabel
                    className={"text-sm w-s"}
                    style={{ color: colors.label }}
                  >
                    Facilities Available
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
                          onCheckedChange={() =>
                            setHasChildPrayer(!hasChildPrayer)
                          }
                          readOnly={!isEditable}
                        />
                        <CheckBox
                          text="Breastfeeding Area"
                          id="EvacPin_BreastfeedChckbox"
                          checked={hasBreastfeed}
                          onCheckedChange={() =>
                            setHasBreastfeed(!hasBreastfeed)
                          }
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
                          id="EvacPin_ToiletField"
                          inputType="number"
                          onSubmit={(e) => setToilet(e.target.value)}
                          value={toilet}
                        />
                      )}
                      {hasKitchen && (
                        <TextField
                          label="Number of Kitchens (optional)"
                          id="EvacPin_KitchenField"
                          inputType="number"
                          onSubmit={(e) => setKicthen(e.target.value)}
                          value={kitchen}
                        />
                      )}
                      {hasChildPrayer && (
                        <TextField
                          label="Number of Prayer Areas/Child-friendly areas (optional)"
                          id="EvacPin_PrayerChildField"
                          inputType="number"
                          onSubmit={(e) => setChildPrayer(e.target.value)}
                          value={childPrayer}
                        />
                      )}
                      {hasBreastfeed && (
                        <TextField
                          label="Number of Breastfeeding areas (optional)"
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
                  id="EvacPin_OtherFacilitiesField"
                  inputType="text"
                  onSubmit={(e) => setOther(e.target.value)}
                  value={other || ""}
                  readonly={!isEditable}
                ></TextField>
                <TextField
                  label="Contact Person*"
                  id="EvacPin_ContactPersonField"
                  inputType="text"
                  onSubmit={(e) => setContactPerson(e.target.value)}
                  value={contactPerson}
                  readonly={!isEditable}
                ></TextField>
                <TextField
                  label="Contact Number*"
                  id="EvacPin_ContactNumberField"
                  inputType="text"
                  onSubmit={(e) => setContactNumber(e.target.value)}
                  value={contactNumber}
                  readonly={!isEditable}
                ></TextField>
                <div>
                  <DatePickerInput
                    label="Expiry Date"
                    idField="EvacPin_ExpiryField"
                    idBtn="EvacPin_CalendarBtn"
                    placeholder={String(expiry)}
                    value={expiry}
                    onChange={setExpiry}
                    readonly={!isEditable}
                    edit={isEditable}
                    showTime
                  />
                  <p className="text-xs italic" id="Admin_HazardIsExpired">
                    Has expired: {String(pinDetails?.is_expired)}
                  </p>
                </div>
                {pinDetails?.is_deactivated && (
                  <div>
                    <TextField
                      label="Deactivated at"
                      value={String(pinDetails?.deactivated_at)}
                      id="Admin_EvacPinDeactivationDate"
                      readonly
                      inputType="text"
                    />
                    <p className="text-xs italic" id="Admin_HazardIsExpired">
                      Has deactivated: {String(pinDetails?.is_deactivated)}
                    </p>
                  </div>
                )}
              </div>
              <div className="w-full max-w-md flex flex-col gap-2 items-center justify-center">
                <ButtonComp
                  text="See Comments"
                  id="EvacPin_OpenPinBtn"
                  variant="primary"
                  heightSize="38px"
                  widthSize="100%"
                  type="button"
                  onClick={() =>
                    navigate(`/admin-pins/${pinDetails?.id}/comments`)
                  }
                ></ButtonComp>
                {!isExpired &&
                  !pinDetails?.is_deactivated &&
                  (isFull ? (
                    <ButtonComp
                      text="Mark as Open"
                      id="EvacPin_OpenPinBtn"
                      variant="outline"
                      heightSize="38px"
                      widthSize="100%"
                      type="button"
                      onClick={() => setWillOpen(true)}
                    ></ButtonComp>
                  ) : (
                    <ButtonComp
                      text="Mark as Full"
                      id="EvacPin_FullPinBtn"
                      variant="outline"
                      heightSize="38px"
                      widthSize="100%"
                      type="button"
                      onClick={(e) => markFull(e)}
                    ></ButtonComp>
                  ))}
                {isExpired && !pinDetails?.is_deactivated && (
                  <div className="w-full max-w-md flex justify-center">
                    <ButtonComp
                      text="Re-Open Pin"
                      variant="primary"
                      id="EvacPin_ReOpenPin"
                      heightSize="38px"
                      widthSize="100%"
                      type="button"
                      onClick={() => setWillReopen(true)}
                    />
                  </div>
                )}
              </div>
            </form>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default EvacDetails;
