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
import CheckBox from "@/components/CheckBox";
import { InputGroupTextarea } from "@/components/ui/input-group";
import {
  handleDelete,
  handleReOpen,
  handleSubmit,
  handleUpdate,
} from "@/lib/evacUtils";
import { useUserContext } from "@/context/AuthContext";
import api from "@/api";
import FormSkeleton from "../../Skeletons/FormSkeleton";
import DatePickerInput from "@/components/DateField";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import AlertDialogue from "@/components/AlertDialogue";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Radio from "@/components/Radio";
import { X } from "lucide-react";
import privacyPdf from "@/assets/Registration/eLikas_DataPrivacy.pdf";
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
};

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
};

function EvacPin() {
  const [existingPin, setExistingPin] = useState(false);
  const [fileName, setFileName] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<undefined | string>();
  const [pinName, setPinName] = useState("");
  const [blkLot, setBlkLot] = useState<string>();
  const [houseNo, setHouseNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [street, setStreet] = useState<string | undefined>();
  const [capacity, setCapacity] = useState("");
  const [openCap, setOpenCap] = useState("");
  const [capacityLevels, setCapacityLevels] = useState<CapacityLevel[]>([]);
  const [address, setAddress] = useState("");
  const [latLng, setLatLng] = useState<[number, number]>();
  const [isPersistent, setIsPersistent] = useState(false);
  // const [other, setOther] = useState("");
  const [otherFields, setOtherFields] = useState([""]);
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [safetyCheck, setSafetyCheck] = useState(false);
  const [infoCheck, setInfoCheck] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [regFlood, setRegFlood] = useState(false);
  const [heavyFlood, setHeavyFlood] = useState(false);
  const [hasAccom, setHasAccom] = useState(false);
  const [hasDRRMO, setHasDRRMO] = useState(false);
  const [hasHealth, setHasHealth] = useState(false);
  const [pwdFriendly, setPWDFriendly] = useState(false);
  const [hasCatchment, setHasCatchment] = useState(false);
  const [hasToilet, setHasToilet] = useState(false);
  const [toilet, setToilet] = useState<string | null>(null);
  const [hasKitchen, setHasKitchen] = useState(false);
  const [kitchen, setKicthen] = useState<string | null>(null);
  const [hasChildPrayer, setHasChildPrayer] = useState(false);
  const [childPrayer, setChildPrayer] = useState<string | null>(null);
  const [hasBreastfeed, setHasBreastfeed] = useState(false);
  const [breastfeed, setBreastfeed] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [evacTypes, setEvacTypes] = useState<EvacType[]>([]);
  const [areaType, setAreaType] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evacPins, setEvacPins] = useState<EvacPin | undefined>();
  const [expiry, setExpiry] = useState<Date | undefined>();
  const [isExpired, setIsExpired] = useState(false);
  const [willDelete, setWillDelete] = useState(false);
  const [willReopen, setWillReopen] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [willOpen, setWillOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [typeLoad, setTypeLoad] = useState(false);
  const [capLoad, setCapLoad] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyId, setBrgyId] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // For update
  const capacityCount = Number(capacity);
  const toiletCount = Number(toilet);
  const kitchenCount = Number(kitchen);
  const childPrayerCount = Number(childPrayer);
  const breastfeedCount = Number(breastfeed);

  const editedToilet = hasToilet ? toilet : "0";
  const editedKitchen = hasKitchen ? kitchen : "0";
  const editedChildPrayer = hasChildPrayer ? childPrayer : "0";
  const editedBreastfeed = hasBreastfeed ? breastfeed : "0";

  const { role } = useUserContext();
  const { id } = useParams();

  const contactValidate = /^09\d{9}$/;

  const defaultExpiry = addDays(new Date(), 7);

  const getBrgy = async () => {
    try {
      setBrgyLoad(true);
      const brgyRes = await api.get(`/locations/barangays?city_id=2`);

      const barangays = brgyRes.data.Barangays;
      setBarangays(barangays);
    } catch (err: any) {
      console.log(err.message);
    } finally {
      setBrgyLoad(false);
    }
  };

  const fileOnChange = (e: any) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setFileName(undefined);

    if (inputRef.current) {
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

    if (!id) {
      setExpiry(defaultExpiry);
    }
  }, []);

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
      setBrgyId(evacDetails.location_id);
      setLatLng(evacDetails.coordinates);
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
      } else {
        setHasToilet(false);
      }
      setToilet(String(evacDetails.toilet_count));
      if (
        evacDetails.kitchen_count &&
        !Number.isNaN(evacDetails.toilet_count)
      ) {
        setHasKitchen(true);
      } else {
        setHasKitchen(false);
      }
      setKicthen(String(evacDetails.kitchen_count));
      if (
        evacDetails.breastfeed_count &&
        !Number.isNaN(evacDetails.breastfeed_count)
      ) {
        setHasBreastfeed(true);
      } else {
        setHasBreastfeed(false);
      }
      setChildPrayer(String(evacDetails.child_prayer_count));
      if (
        evacDetails.child_prayer_count &&
        !Number.isNaN(evacDetails.child_prayer_count)
      ) {
        setHasChildPrayer(true);
      } else {
        setHasChildPrayer(false);
      }
      setBreastfeed(String(evacDetails.breastfeed_count));
      if (
        evacDetails.breastfeed_count &&
        !Number.isNaN(evacDetails.breastfeed_count)
      ) {
        setHasBreastfeed(true);
      } else {
        setHasBreastfeed(false);
      }
      setOtherFields(evacDetails.other_facilities);
      setContactPerson(evacDetails.contact_person);
      setContactNumber(evacDetails.contact_number);
      setIsPersistent(evacDetails.is_persistent);
      setEvacPins(evacDetails);
    } catch (err: string | any) {
      console.log(err.response.data);
      toast.error(err.response.data.error);
    } finally {
      setLoading(false);
    }
  };

  const getBrgyName = (brgyId: string) => {
    const brgyName =
      barangays.find((brgy) => String(brgy.id) === brgyId)?.name ??
      "No Barangay";
    return brgyName;
  };

  const getCapacityLevels = async () => {
    try {
      setCapLoad(true);
      const response = await api.get("/capacity-levels");
      setCapacityLevels(response.data);
      setCapLoad(false);
    } catch (error: any) {
      console.error(error.response.data);
      setCapLoad(false);
    }
  };

  const addOtherField = () => {
    setOtherFields([...otherFields, ""]);
  };

  const updateOtherField = (index: number, value: string) => {
    const updated = [...otherFields];
    updated[index] = value;
    setOtherFields(updated);
  };

  const removeOtherField = (index: number) => {
    setOtherFields(otherFields.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (id) {
      getEvacDetails();
      getCapacityLevels();
      getBrgy();
    } else if (!id) {
      const getAreaTypes = async () => {
        try {
          setTypeLoad(true);
          const response = await api.get("/evac-types");
          setEvacTypes(response.data);

          if (!response) {
            console.log("Failed to fetch evac types");
            return;
          }

          setTypeLoad(false);
        } catch (error: any) {
          console.error(error.response.data);
          setTypeLoad(false);
        }
      };

      getBrgy();
      getAreaTypes();
      getCapacityLevels();
    }
  }, [hasUpdated]);

  useEffect(() => {
    if (isEditable) {
      const getAreaTypes = async () => {
        try {
          setTypeLoad(true);

          const response = await api.get("/evac-types");
          setEvacTypes(response.data);

          if (!response) {
            console.log("Failed to fetch evac types");
            return;
          }

          setTypeLoad(false);
        } catch (error: any) {
          console.error(error.response.data);
          setTypeLoad(false);
        }
      };

      const getCapacityLevels = async () => {
        try {
          setCapLoad(true);
          const response = await api.get("/capacity-levels");
          setCapacityLevels(response.data);
          setCapLoad(false);
        } catch (error: any) {
          console.error(error.response.data);
          setCapLoad(false);
        }
      };

      getAreaTypes();
      getCapacityLevels();
    }
  }, [isEditable]);

  useEffect(() => {
    if (isEditable && evacPins) {
      setRegFlood(evacPins.for_reg_flood);
      setDesc(evacPins.description);
      setRegFlood(evacPins.for_reg_flood);
      setHeavyFlood(evacPins.for_heavy_flood);
      setAreaType(evacPins.area_type_id);
      setPinName(evacPins.name);
      setDesc(evacPins.description);
      setAddress(evacPins.address);
      setCapacity(String(evacPins.capacity_level_id));
      setHasAccom(evacPins.has_accom);
      setHasDRRMO(evacPins.has_DRRMO);
      setHasHealth(evacPins.has_health);
      setPWDFriendly(evacPins.pwd_friendly);
      setHasCatchment(evacPins.has_catchment);
    }
  }, [isEditable, evacPins]);

  useEffect(() => {
    setExpiry(defaultExpiry);
  }, [willReopen]);

  const submitValidation = () => {
    if (!regFlood && !heavyFlood) {
      toast.error("Please check either regular or heavy flooding");
      return;
    }

    if (!contactValidate.test(contactNumber)) {
      toast.error("Invalid Contact Number.");
      return;
    }

    if (
      !pinName ||
      !areaType ||
      !capacityCount ||
      (!regFlood && !heavyFlood) ||
      !contactPerson ||
      !contactNumber
    ) {
      toast.error("Please fill in the required fields marked with *.");
      return;
    }

    if (hasToilet) {
      if (!toilet || toilet == "" || toilet == "0") {
        toast.error("Please fill in the toilet count.");
        return;
      }
    } else {
      setToilet(null);
    }

    if (hasKitchen) {
      if (!kitchen || kitchen == "" || kitchen == "0") {
        toast.error("Please fill in the kitchen count.");
        return;
      }
    } else {
      setKicthen(null);
    }

    if (hasChildPrayer) {
      if (!childPrayer || childPrayer == "" || childPrayer == "0") {
        toast.error("Please fill in the child/prayer area count.");
        return;
      }
    } else {
      setChildPrayer(null);
    }

    if (hasBreastfeed) {
      if (!breastfeed || breastfeed == "" || breastfeed == "0") {
        toast.error("Please fill in breastfeeding area count.");
        return;
      }
    } else {
      setBreastfeed(null);
    }

    if (!contactValidate.test(contactNumber)) {
      toast.error("Invalid Contact Number.");
      return;
    }

    setShowCreate(true);
  };

  const submit = (e: React.FormEvent) => {
    // const dateTime = formatInTimeZone(new Date(), "Asia/Manila", "yyyy-MM-dd");
    e.preventDefault();

    const formData = new FormData();

    const expDate = expiry ? new Date(expiry) : addDays(new Date(), 7);

    const now = new Date();
    const expDateWithTime = new Date(
      expDate.getFullYear(),
      expDate.getMonth(),
      expDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );

    if (fileName) {
      formData.append("file", fileName);
    }

    formData.append("name", pinName);
    formData.append(
      "address",
      `${blkLot ?? ""} ${houseNo ?? ""} ${buildingName ?? ""} ${street ?? ""}`,
    );
    formData.append("description", desc);
    formData.append("lat", String(center[0]));
    formData.append("lng", String(center[1]));
    formData.append("location_id", String(brgyId));
    formData.append("area_type", String(areaType));
    formData.append("capacity_level", String(capacityCount));
    formData.append(
      "is_persistent",
      String(role === "indiv" ? 0 : isPersistent ? 1 : 0),
    );
    formData.append("for_reg_flood", regFlood ? "1" : "0");
    formData.append("for_heavy_flood", heavyFlood ? "1" : "0");
    formData.append("has_accom", hasAccom ? "1" : "0");
    formData.append("has_DRRMO", hasDRRMO ? "1" : "0");
    formData.append("has_health", hasHealth ? "1" : "0");
    formData.append("pwd_friendly", pwdFriendly ? "1" : "0");
    formData.append("has_catchment", hasCatchment ? "1" : "0");
    if (toiletCount !== 0 || toiletCount !== null) {
      formData.append("toilet_count", String(toiletCount));
    }
    if (kitchenCount !== 0 || kitchenCount !== null) {
      formData.append("kitchen_count", String(kitchenCount));
    }
    if (childPrayerCount !== 0 || childPrayerCount !== null) {
      formData.append("child_prayer_count", String(childPrayerCount));
    }
    if (breastfeedCount !== 0 || breastfeedCount !== null) {
      formData.append("breastfeed_count", String(breastfeedCount));
    }
    otherFields.forEach((facility, index) => {
      formData.append(`other_facilities[${index}]`, facility);
    });
    formData.append("contact_person", contactPerson);
    formData.append("contact_number", contactNumber);
    formData.append(
      "expiry",
      formatInTimeZone(
        expDateWithTime,
        "Asia/Manila",
        "yyyy-MM-dd HH:mm:ssXXX",
      ),
    );

    console.log(otherFields);

    handleSubmit({
      e: e,
      formData: formData,
      navigate: navigate,
      setDisabled,
    });
  };

  const update = (e: React.FormEvent) => {
    if (!regFlood && !heavyFlood) {
      toast.error("Please check either regular or heavy flooding");
      return;
    }

    if (
      !pinName ||
      !areaType ||
      !capacityCount ||
      (!regFlood && !heavyFlood) ||
      !contactPerson ||
      !contactNumber
    ) {
      toast.error("Please fill in the required fields marked with an *.");
      return;
    }

    if (!contactValidate.test(contactNumber)) {
      toast.error("Invalid Contact Number.");
      return;
    }

    if (hasToilet) {
      if (!toilet || toilet == "" || toilet == "0") {
        toast.error("Please fill in the toilet count.");
        return;
      }
    } else {
      setToilet("0");
    }

    if (hasKitchen) {
      if (!kitchen || kitchen == "" || kitchen == "0") {
        toast.error("Please fill in the kitchen count.");
        return;
      }
    } else {
      setKicthen("0");
    }

    if (hasChildPrayer) {
      if (!childPrayer || childPrayer == "" || childPrayer == "0") {
        toast.error("Please fill in the child/prayer area count.");
        return;
      }
    } else {
      setChildPrayer("0");
    }

    if (hasBreastfeed) {
      if (!breastfeed || breastfeed == "" || breastfeed == "0") {
        toast.error("Please fill in breastfeeding area count.");
        return;
      }
    } else {
      setBreastfeed("0");
    }

    const expDate = expiry ? new Date(expiry) : addDays(new Date(), 7);

    const now = new Date();
    const expDateWithTime = new Date(
      expDate.getFullYear(),
      expDate.getMonth(),
      expDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );

    handleUpdate({
      e: e,
      id: id,
      ...(pinName && { name: pinName }),
      address: `${blkLot ?? ""} ${houseNo ?? ""} ${buildingName ?? ""} ${street ?? ""}`,
      description: desc,
      area_type: areaType,
      capacity_level: Number(capacity),
      is_persistent: role === "indiv" ? false : isPersistent,
      for_reg_flood: regFlood,
      for_heavy_flood: heavyFlood,
      has_accom: hasAccom,
      has_DRRMO: hasDRRMO,
      has_health: hasHealth,
      pwd_friendly: pwdFriendly,
      has_catchment: hasCatchment,
      toilet_count: Number(editedToilet),
      kitchen_count: Number(editedKitchen),
      child_prayer_count: Number(editedChildPrayer),
      breastfeed_count: Number(editedBreastfeed),
      other_facilities: otherFields,
      ...(contactPerson && { contact_person: contactPerson }),
      ...(contactNumber && { contact_number: contactNumber }),
      role: role ? role : "",
      ...(isPersistent && {
        expiry: formatInTimeZone(
          expDateWithTime,
          "Asia/Manila",
          "yyyy-MM-dd HH:mm:ssXXX",
        ),
      }),
      setIsEditable: setIsEditable,
      setHasUpdated: setHasUpdated,
      location_id: brgyId,
      setDisabled,
    });
  };

  const deac = () => {
    handleDelete({
      id: id,
      navigate: navigate,
      redirect: "/History",
      setDisabled,
    });
  };

  const reOpen = (e: React.FormEvent) => {
    const expDate = addDays(new Date(), 7);

    handleReOpen({
      e: e,
      expiry: formatInTimeZone(
        toZonedTime(expDate, "Asia/Manila"),
        "Asia/Manila",
        "yyyy-MM-dd HH:mm:ssXXX",
      ),
      id: id,
      navigate: navigate,
      redirect: "/History",
      setDisabled,
    });
  };

  const markFull = (e: React.FormEvent) => {
    e.preventDefault();

    setDisabled(true);
    const fullLevel = capacityLevels?.find(
      (level) => level.capacity_level === "Full",
    )?.id;

    if (isFull) {
      if (!openCap) {
        toast.error(
          "You must specify a capacity level before opening an evacuation center.",
        );
        setDisabled(false);
        return;
      }
    }

    const newCapacityLevel = isFull ? Number(openCap) : fullLevel;

    const response = api.put(`/pins/${id}`, {
      capacity_level: newCapacityLevel,
    });

    toast.promise(response, {
      loading: isFull ? "Marking as open..." : "Marking as full...",
      success: isFull ? "Pin marked as open!" : "Pin marked as full!",
      error: (err: any) => err.response.data,
      position: "top-center",
    });

    response
      .then(() => {
        getEvacDetails();
        setIsFull(!isFull);
      })
      .catch((err: any) => {
        console.log(err.response);
      })
      .finally(() => setDisabled(false));
  };

  useEffect(() => {
    if (location.state?.from === "/History") {
      setExistingPin(true);
    }
  }, [[location.state?.from]]);

  useEffect(() => {
    if (location.state?.from === "/map") {
      setIsEditable(true);
    } else {
      setIsEditable(false);
    }
  }, []);

  return loading ? (
    <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
      <FormSkeleton />
    </div>
  ) : (
    <>
      {willReopen && (
        <AlertDialogue
          contentId="EvacPin_ReopenContent"
          closeId="EvacPin_ReopenClose"
          actionId="EvacPin_ReopenBtn"
          open={willReopen}
          title="You are about to re-open this pin"
          description="Re-opening this pin add it to the map. The expiration date will default to 7 days."
          buttonText="Re-open"
          onClose={() => {
            setWillReopen(false);
          }}
          onClick={(e) => reOpen(e)}
          disabled={disabled}
        ></AlertDialogue>
      )}
      {willDelete && (
        <AlertDialogue
          contentId="EvacPin_DeacContent"
          closeId="EvacPin_DeacClose"
          actionId="EvacPin_DeacBtn"
          open={willDelete}
          title="You are about to delete this pin"
          description="Deleting this pin will remove it to the map permanently."
          buttonText="Delete"
          onClose={() => {
            setWillDelete(false);
          }}
          onClick={() => deac()}
          disabled={disabled}
        />
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
          disabled={disabled}
        >
          {capLoad ? (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
              </div>
            </div>
          ) : (
            <Radio
              key={1}
              isRequired
              onValueChange={setOpenCap}
              onSubmit={(e) => setOpenCap(e.target.value)}
              options={capacityLevels.map((capacity) => ({
                key: capacity.id,
                id: String(capacity.id),
                value: String(capacity.id),
                label: capacity.capacity_level,
              }))}
            />
          )}
        </AlertDialogue>
      )}
      {showCreate && (
        <AlertDialogue
          contentId="EvacPin_CreateContent"
          closeId="EvacPin_CreateClose"
          actionId="EvacPin_CreateBtn"
          open={showCreate}
          title="Mark this pin on the map?"
          description="By marking this pin, you accept responsibility for its accuracy."
          buttonText="Mark on the map"
          onClose={() => {
            setShowCreate(false);
          }}
          onClick={(e) => submit(e)}
          disabled={disabled}
        />
      )}
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
            <div className="flex flex-col gap-1">
              <p
                className="italic text-sm max-w-sm text-center"
                style={{ color: colors.label }}
              >
                Help others find safe temporary shelter.
              </p>
              <b
                className="italic text-sm max-w-sm text-center"
                style={{ color: colors.label }}
              >
                All marked with an * are required fields.
              </b>
              {role === "indiv" && (
                <b
                  className="italic text-sm max-w-sm text-center"
                  style={{ color: colors.label }}
                >
                  You may only create 10 active evacuation pins.
                </b>
              )}
            </div>
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
              {role !== "indiv" && (
                <CheckBox
                  text="Is this evacuation center persistent?"
                  id="EvacPin_isPersistentChckbox"
                  checked={isPersistent}
                  onCheckedChange={setIsPersistent}
                  readOnly={!id || isEditable ? false : true}
                />
              )}
              <div className="flex gap-4">
                <CheckBox
                  text="for Regular Flooding"
                  id="EvacPin_isRegChckbox"
                  checked={regFlood}
                  onCheckedChange={setRegFlood}
                  readOnly={!id || isEditable ? false : true}
                />
                <CheckBox
                  text="for Heavy Flooding"
                  id="EvacPin_isHeavyChckbox"
                  checked={heavyFlood}
                  onCheckedChange={setHeavyFlood}
                  readOnly={!id || isEditable ? false : true}
                />
              </div>
            </Field>
            <div className="flex flex-col gap-3">
              {/* To test when PWA is done */}
              {!id ? (
                <>
                  <TextField
                    label="Attach an Image (optional)"
                    inputType="file"
                    id="EvacPin_PhotoField"
                    onSubmit={fileOnChange}
                    ref={inputRef}
                    accept="image/png, image/jpeg, image/heic"
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
                </>
              ) : (
                <>
                  {evacPins?.media[0]?.url && (
                    <img src={String(evacPins?.media[0].url)} />
                  )}
                </>
              )}
            </div>
            {isEditable || !id ? (
              <SelectDropdown
                value={String(areaType)}
                onValueChange={(val) => setAreaType(Number(val))}
                label="Location Type*"
                id="EvacPin_LocTypeField"
                onSubmit={(e) => setAreaType(Number(e.target.value))}
                options={evacTypes.map((type) => ({
                  label: type.evac_type,
                  value: type.id.toString(),
                }))}
                isRequired
                loading={typeLoad}
              />
            ) : (
              <TextField
                label="Location Type*"
                value={evacPins?.area_type}
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
              onSubmit={(e) => setPinName(e.target.value)}
              isRequired
              readonly={!id || isEditable ? false : true}
              maxLength={50}
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
                readOnly={!id || isEditable ? false : true}
                required
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
                center={latLng ? latLng : center}
                zoom={17}
                scrollWheelZoom={false}
                style={{ height: "30vh", width: "100%" }}
                id="EvacPin_MapContainer"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                  url={`https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=fvhZKnEDjdbWySpYqEZM`}
                />
                <MapClickHandler
                  onPinClick={() => {}}
                  clickedLoc={latLng ? latLng : clickedLoc}
                />
              </MapContainer>
              {id && <p className="text-sm">{address}</p>}
              {!id || isEditable ? (
                <>
                  <TextField
                    label="Block and Lot (optional)"
                    placeholder="Blk # Lot #"
                    id="EvacPin_BlkLotField"
                    inputType="text"
                    onSubmit={(e) => setBlkLot(e.target.value)}
                  ></TextField>
                  <TextField
                    label="House Number (optional)"
                    placeholder="i.e. 111"
                    id="EvacPin_HouseNumberField"
                    inputType="text"
                    onSubmit={(e) => setHouseNo(e.target.value)}
                  ></TextField>
                  <TextField
                    label="Building Name (optional)"
                    id="EvacPin_HouseNumberField"
                    inputType="text"
                    onSubmit={(e) => setBuildingName(e.target.value)}
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
                  <SelectDropdown
                    value={String(brgyId)}
                    onValueChange={(val) => setBrgyId(Number(val))}
                    label="Barangay*"
                    id="EvacPin_BarangayDropdown"
                    onSubmit={(e) => setBrgyId(Number(e.target.value))}
                    options={barangays?.map((brgy) => ({
                      label: brgy.name,
                      value: String(brgy.id),
                    }))}
                    isRequired
                    loading={brgyLoad}
                  />
                </>
              ) : (
                <TextField
                  label="Barangay"
                  value={getBrgyName(String(brgyId))}
                  inputType="text"
                  id="EvacPin_BarangayField"
                  readonly
                />
              )}
            </Field>
            {isEditable || !id ? (
              <SelectDropdown
                value={capacity}
                onValueChange={setCapacity}
                label="Capacity Level*"
                description="Indicate how many people this evacuation center can hold."
                id="EvacPin_CapacityField"
                onSubmit={(e) => setCapacity(e.target.value)}
                options={capacityLevels
                  ?.filter((level) => level.capacity_level !== "Full")
                  .map((level) => ({
                    label: level.capacity_level,
                    value: String(level.id),
                  }))}
                isRequired
              />
            ) : (
              <TextField
                label="Capacity Level"
                id="EvacPin_Capacity"
                inputType="text"
                value={evacPins?.capacity_name}
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
                      readOnly={!id || isEditable ? false : true}
                    />
                    <CheckBox
                      text="DRRMO Office"
                      id="EvacPin_DRRMOChckbox"
                      checked={hasDRRMO}
                      onCheckedChange={() => setHasDRRMO(!hasDRRMO)}
                      readOnly={!id || isEditable ? false : true}
                    />
                  </div>
                  <div className="flex gap-6">
                    <CheckBox
                      text="Health Station"
                      id="EvacPin_HealthChckbox"
                      checked={hasHealth}
                      onCheckedChange={() => setHasHealth(!hasHealth)}
                      readOnly={!id || isEditable ? false : true}
                    />
                    <CheckBox
                      text="PWD Friendly"
                      id="EvacPin_PWDChckbox"
                      checked={pwdFriendly}
                      onCheckedChange={() => setPWDFriendly(!pwdFriendly)}
                      readOnly={!id || isEditable ? false : true}
                    />
                  </div>
                  <div className="flex gap-6">
                    <CheckBox
                      text="Rainwater Catchment Facility"
                      id="EvacPin_RainCatchChckbox"
                      checked={hasCatchment}
                      onCheckedChange={() => setHasCatchment(!hasCatchment)}
                      readOnly={!id || isEditable ? false : true}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <CheckBox
                        text="Toilet"
                        id="EvacPin_ToiletChckbox"
                        checked={
                          hasToilet ||
                          (hasToilet &&
                            toiletCount !== 0 &&
                            toiletCount !== null)
                        }
                        onCheckedChange={() => setHasToilet(!hasToilet)}
                        readOnly={!id || isEditable ? false : true}
                      />
                      {hasToilet && (
                        <TextField
                          label="Number of Toilets*"
                          id="EvacPin_ToiletField"
                          inputType="number"
                          onSubmit={(e) => setToilet(e.target.value)}
                          value={toilet ?? ""}
                          isRequired
                          readonly={!id || isEditable ? false : true}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <CheckBox
                        text="Kitchen"
                        id="EvacPin_KitchenChckbox"
                        checked={
                          hasKitchen ||
                          (hasKitchen &&
                            kitchenCount !== 0 &&
                            kitchenCount !== null)
                        }
                        onCheckedChange={() => setHasKitchen(!hasKitchen)}
                        readOnly={!id || isEditable ? false : true}
                      />
                      {hasKitchen && (
                        <TextField
                          label="Number of Kitchens*"
                          id="EvacPin_KitchenField"
                          inputType="number"
                          onSubmit={(e) => setKicthen(e.target.value)}
                          value={kitchen ?? ""}
                          isRequired
                          readonly={!id || isEditable ? false : true}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <CheckBox
                        text="Child/Prayer Area"
                        id="EvacPin_ChildPrayerChckbox"
                        checked={
                          hasChildPrayer ||
                          (hasChildPrayer &&
                            childPrayerCount !== 0 &&
                            childPrayerCount !== null)
                        }
                        onCheckedChange={() =>
                          setHasChildPrayer(!hasChildPrayer)
                        }
                        readOnly={!id || isEditable ? false : true}
                      />
                      {hasChildPrayer && (
                        <TextField
                          label="Number of Prayer Areas/Child-friendly areas*"
                          id="EvacPin_PrayerChildField"
                          inputType="number"
                          onSubmit={(e) => setChildPrayer(e.target.value)}
                          value={childPrayer ?? ""}
                          isRequired
                          readonly={!id || isEditable ? false : true}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <CheckBox
                        text="Breastfeeding Area"
                        id="EvacPin_BreastfeedChckbox"
                        checked={
                          hasBreastfeed ||
                          (hasBreastfeed &&
                            breastfeedCount !== 0 &&
                            breastfeedCount !== null)
                        }
                        onCheckedChange={() => setHasBreastfeed(!hasBreastfeed)}
                        readOnly={!id || isEditable ? false : true}
                      />
                      {hasBreastfeed && (
                        <TextField
                          label="Number of Breastfeeding areas*"
                          id="EvacPin_BreastfeedField"
                          inputType="number"
                          onSubmit={(e) => setBreastfeed(e.target.value)}
                          value={breastfeed ?? ""}
                          isRequired
                          readonly={!id || isEditable ? false : true}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Field>
            <Field>
              <FieldLabel
                className={"text-sm w-s"}
                style={{ color: colors.label }}
              >
                Other Facilities (optional)
              </FieldLabel>
              {otherFields.map((value, index) => (
                <div className="flex items-center gap-2">
                  <TextField
                    label=""
                    key={index}
                    id="EvacPin_OtherFacilitiesField"
                    inputType="text"
                    onSubmit={(e) => updateOtherField(index, e.target.value)}
                    value={value}
                    readonly={!id || isEditable ? false : true}
                  ></TextField>
                  <X onClick={() => removeOtherField(index)} />
                </div>
              ))}
              <div className="w-full flex justify-end">
                <ButtonComp
                  text="Add More"
                  variant="outline"
                  id="EvacPin_AddFacilityBtn"
                  onClick={addOtherField}
                  widthSize="10px"
                />
              </div>
            </Field>
            <TextField
              label="Contact Person*"
              id="EvacPin_ContactPersonField"
              inputType="text"
              onSubmit={(e) => setContactPerson(e.target.value)}
              value={contactPerson}
              readonly={!id || isEditable ? false : true}
              isRequired
              maxLength={100}
            ></TextField>
            <TextField
              label="Contact Number*"
              placeholder="09XXXXXXXXX"
              id="EvacPin_ContactNumberField"
              inputType="text"
              onSubmit={(e) => setContactNumber(e.target.value)}
              value={contactNumber}
              readonly={!id || isEditable ? false : true}
              isRequired
              maxLength={15}
            ></TextField>
            {role === "brgy_op" && (
              <DatePickerInput
                label="Expiry Date (optional)"
                idField="EvacPin_ExpiryField"
                idBtn="EvacPin_CalendarBtn"
                value={expiry}
                onChange={setExpiry}
                readonly={!id || (isPersistent && isEditable) ? false : true}
                edit={(isPersistent && isEditable) || !id}
                desc="The default expiration date is 7 days from now"
                clearDate={!id}
              />
            )}
            {role === "indiv" && (
              <DatePickerInput
                label="Expiry Date"
                idField="EvacPin_ExpiryField"
                idBtn="EvacPin_CalendarBtn"
                value={expiry}
                readonly={true}
                desc="The default expiration date is 7 days from now"
              />
            )}
            {id ? (
              !isEditable ? (
                <>
                  <div className="w-full max-w-md flex justify-center">
                    {!isExpired &&
                      (isFull ? (
                        <ButtonComp
                          text="Mark as Open"
                          id="EvacPin_OpenPinBtn"
                          variant="outline"
                          heightSize="38px"
                          widthSize="100%"
                          type="button"
                          onClick={() => setWillOpen(true)}
                          isDisabled={disabled}
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
                          isDisabled={disabled}
                        ></ButtonComp>
                      ))}
                  </div>
                  {isExpired && isPersistent && (
                    <div className="w-full max-w-md flex justify-center">
                      <ButtonComp
                        text="Re-Open Pin"
                        variant="outline"
                        id="EvacPin_ReOpenPin"
                        heightSize="38px"
                        widthSize="100%"
                        onClick={() => setWillReopen(true)}
                        isDisabled={disabled}
                      />
                    </div>
                  )}
                  {!isExpired && (
                    <div className="mx-2 flex justify-evenly shrink gap-4">
                      <ButtonComp
                        text="Edit"
                        id="EvacPin_UpdatePinBtn"
                        variant="primary"
                        heightSize="38px"
                        widthSize="20"
                        onClick={() => setIsEditable(true)}
                        type="button"
                        isDisabled={disabled}
                      ></ButtonComp>
                      <ButtonComp
                        text="Delete"
                        id="EvacPin_ClosePinBtn"
                        variant="important"
                        heightSize="38px"
                        widthSize="20"
                        type="button"
                        onClick={() => setWillDelete(true)}
                        isDisabled={disabled}
                      ></ButtonComp>
                    </div>
                  )}
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
                      // widthSize="20"
                      onClick={(e) => {
                        update(e);
                      }}
                      isDisabled={disabled}
                    ></ButtonComp>
                    <ButtonComp
                      text="Cancel"
                      id="EvacPin_CancelUpdBtn"
                      variant="outline"
                      heightSize="38px"
                      // widthSize="20"
                      onClick={() => {
                        setIsEditable(false);
                      }}
                      type="button"
                      isDisabled={disabled}
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
                <div>
                  <CheckBox
                    id="EvacPin_PrivacyCheck"
                    checked={acceptedPrivacy}
                    onCheckedChange={(val) => {
                      setAcceptedPrivacy(!!val);
                    }}
                    text={
                      <>
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(privacyPdf, "_blank");
                          }}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Data Privacy Notice
                        </button>
                        .
                      </>
                    }
                  />
                </div>
                <div className="w-full max-w-md flex justify-center">
                  <ButtonComp
                    text="Create Pin"
                    variant="primary"
                    id="EvacPin_SubmitBtn"
                    isDisabled={!safetyCheck || !infoCheck || !acceptedPrivacy || disabled}
                    heightSize="38px"
                    widthSize="100%"
                    onClick={() => submitValidation()}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EvacPin;
