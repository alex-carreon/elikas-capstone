import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
} from "@/components/ui/drawer";
import {
  ChevronDownIcon,
  ShieldCheck,
  CircleX,
  File,
  Camera,
  ChevronUpIcon,
  Form,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import DrawerIcon from "@/assets/Map/Drawer.svg";
import AccoIcon from "@/assets/Map/Facilities/AccomodationIcon.svg";
import CrIcon from "@/assets/Map/Facilities/CrIcon.svg";
import BfIcon from "@/assets/Map/Facilities/breastfeeding.svg";
import kidsIcon from "@/assets/Map/Facilities/kids.svg";
import kitchenIcon from "@/assets/Map/Facilities/kitchen.svg";
import officeIcon from "@/assets/Map/Facilities/Office.svg";
import pwdIcon from "@/assets/Map/Facilities/PWD Ramp.svg";
import catchIcon from "@/assets/Map/Facilities/rain-catch.svg";
import healthIcon from "@/assets/Map/Facilities/health.svg";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import ButtonComp from "@/components/Button";
import CSIcon from "@/assets/Map/CrowdsourceIcon.svg";
import { useEffect, useState, useRef, Fragment, type FormEvent } from "react";
import { differenceInDays } from "date-fns";
import api from "@/api";
import { DrawerTitle } from "@/components/ui/drawer";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { Skeleton } from "@/components/ui/skeleton";
import PostRow from "@/components/PostRow";
import { useUserContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { Spinner } from "../ui/spinner";

type CommentType = {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  media: string;
  posted_at: string;
  posted_by: postedBy;
};

type verifiedBy = {
  gov_op_id: number | null;
  username: string | null;
};

type postedBy = {
  user_id: number;
  username: string;
  posted_at: string;
  avatar_seed: string;
};

type media = {
  id: number;
  type: string;
  url: string | undefined;
};

type EvacPin = {
  id: number;
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
  expiry: string | null | undefined;
  deactivated_at: string | null;
  last_updated: string | null;
  verified_by: verifiedBy;
  posted_by: postedBy;
  last_confirmed: string | null;
  media: media[];
  avatar_seed: string;
};

type FacilityKey =
  | "has_accom"
  | "has_DRRMO"
  | "has_health"
  | "pwd_friendly"
  | "has_catchment"
  | "toilet_count"
  | "kitchen_count"
  | "child_prayer_count"
  | "breastfeed_count";

type Facility = {
  key: FacilityKey;
  name: string;
  icon: string;
  type: "boolean" | "count";
};

const facilities: Facility[] = [
  { key: "has_accom", name: "Accomodation", icon: AccoIcon, type: "boolean" },
  { key: "has_DRRMO", name: "DRRM Office", icon: officeIcon, type: "boolean" },
  {
    key: "has_health",
    name: "Health Station",
    icon: healthIcon,
    type: "boolean",
  },
  { key: "pwd_friendly", name: "PWD Friendly", icon: pwdIcon, type: "boolean" },
  {
    key: "has_catchment",
    name: "Rain Catching",
    icon: catchIcon,
    type: "boolean",
  },
  {
    key: "toilet_count",
    name: "Toilet",
    icon: CrIcon,
    type: "count",
  },
  {
    key: "kitchen_count",
    name: "Kitchen",
    icon: kitchenIcon,
    type: "count",
  },
  {
    key: "child_prayer_count",
    name: "Child/Prayer Area",
    icon: kidsIcon,
    type: "count",
  },
  {
    key: "breastfeed_count",
    name: "Breastfeeding Area",
    icon: BfIcon,
    type: "count",
  },
];

function EvacPinDrawer({
  selectedPin,
  onFindRoute,
  isExpanded,
  setIsExpanded,
}: {
  selectedPin: EvacPin;
  onFindRoute?: (findRoute: boolean) => void;
  isExpanded?: boolean;
  setIsExpanded?: (val: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [commentsLoad, setCommentsLoad] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [evacPinDetails, setEvacPinDetails] = useState<EvacPin | undefined>();
  const [daysLeft, setDaysleft] = useState(0);
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [available, setAvailable] = useState<typeof facilities>([]);
  const [unavailable, setUnavailable] = useState<typeof facilities>([]);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [openImageCollapse, setOpenImageCollapse] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState(0);
  const [verified, setVerified] = useState(false);
  const [newComment, setNewComment] = useState<string | null>();
  const [seed, setSeed] = useState("");
  const [seedLoad, setSeedLoad] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { role } = useUserContext();

  const avatar = createAvatar(bigSmile, {
    seed: seed,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
    scale: 90,
    accessoriesProbability: 50,
    eyes: ["cheery", "normal", "starstruck", "winking"],
    mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
  });

  const dataUri = avatar.toDataUri();

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const fileOnChange = (e: any) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setImage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const getComments = async () => {
    try {
      setCommentsLoad(true);
      const response = await api.get(`/evac-areas/${selectedPin.id}/comments`);
      setComments(response.data.comments);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setCommentsLoad(false);
    }
  };

  const getAvatar = async () => {
    try {
      setSeedLoad(true);
      const response = await api.get("/profile");

      const userData = response.data;
      console.log(userData);

      setSeed(userData.avatar_seed);

      return userData;
    } catch (err: string | any) {
      console.error("Status:", err.response?.status);
      console.error("Data:", err.response?.data);
      console.error("Message:", err.message);
    } finally {
      setSeedLoad(false);
    }
  };

  const submitComment = (e: FormEvent) => {
    e.preventDefault();

    const formData = new FormData();

    if (newComment) {
      formData.append("content", newComment);
    }

    if (image) {
      formData.append("file", image);
    }

    try {
      const response = api.post(
        `/evac-areas/${selectedPin.id}/comments`,
        formData,
        {
          headers: {
            "Content-Type": undefined,
          },
        },
      );

      toast.promise(response, {
        loading: "Adding your comment...",
        success: "Comment successfully added!",
        error: (err) => err?.message || "Please try again.",
        position: "top-center",
      });

      response.then(() => {
        setNewComment(null);
        setImage("");
        getComments();
      });
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  useEffect(() => {
    if (!selectedPin) return;
    if (!isExpanded) return;

    getComments();
    getAvatar();
  }, [isExpanded]);

  useEffect(() => {
    if (!selectedPin) return;

    const getEvacPinDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pins/${selectedPin.id}`);
        const evacPinDetails = await response.data;
        setEvacPinDetails(evacPinDetails);
        setVerifiedBy(evacPinDetails.verified_by.gov_op_id);

        const today = new Date();
        const expDate = new Date(evacPinDetails.expiry);

        setDaysleft(differenceInDays(expDate, today));

        if (verifiedBy != null) {
          setVerified(true);
        } else setVerified(false);

        const available = facilities.filter((facilities) =>
          facilities.type === "count"
            ? response.data[facilities.key] !== null
            : response.data[facilities.key] === true,
        );
        setAvailable(available);

        const unavailable = facilities.filter((facilities) =>
          facilities.type === "count"
            ? response.data[facilities.key] === null
            : response.data[facilities.key] === false,
        );
        setUnavailable(unavailable);
      } catch (err: string | any) {
        console.log(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    getEvacPinDetails();
  }, [selectedPin?.id, verified]);

  const verifyPin = async (e: React.FormEvent<Element>) => {
    e.preventDefault();

    try {
      const response = api.patch(`/pins/${evacPinDetails?.id}/verify`, {
        verified: !verified,
      });

      if (!response) {
        toast.error("Failed to verify pin. Please try again.");
        console.log(response);
      }

      setVerified(!verified);
      toast.success("Pin Verified!");
    } catch (err: any) {
      console.log(err.response);
    }
  };

  return loading ? (
    <>
      <div className="w-full px-4 pb-4 flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-38 rounded-lg bg-[#59260B]/30" />
          </div>
          <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <div className="w-full flex flex-col self-start gap-2">
          <div className="w-full flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-[#59260B]/30" />
            <div className="w-full space-y-2 items-start justify-center">
              <Skeleton className="h-4 w-full bg-[#59260B]/30" />
              <Skeleton className="h-4 w-[200px] bg-[#59260B]/30" />
            </div>
          </div>
          <Skeleton className="h-12 w-full bg-[#59260B]/30" />
          <Skeleton className="h-12 w-full bg-[#59260B]/30" />
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="flex justify-between px-4">
        <div>
          <ButtonComp
            text={isExpanded ? "Press to Collapse" : "Press to Expand"}
            id="DrawerInfo_ExpandCollapse"
            variant="outline"
            onClick={() => setIsExpanded?.(!isExpanded)}
            widthSize="40"
          ></ButtonComp>
        </div>
        <div className="flex items-center gap-2">
          {role === "brgy_op" ? (
            verified ? (
              <ButtonComp
                text="Un-verify"
                variant="outline"
                id="Drawer_UnverifyBtn"
                heightSize="34px"
                onClick={(e) => verifyPin(e)}
              />
            ) : (
              <ButtonComp
                text="Verify"
                variant="primary"
                id="Drawer_VerifyBtn"
                heightSize="34px"
                onClick={(e) => verifyPin(e)}
              />
            )
          ) : null}
          <DrawerClose id="DrawerInfo_Close">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
      </div>
      <DrawerHeader>
        <DrawerTitle>
          <DrawerDescription />
        </DrawerTitle>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <img src={DrawerIcon} className="w-10" />
            <div>
              <div className="flex flex-row">
                <p className="text-lg font-semibold">{evacPinDetails?.name}</p>
                {evacPinDetails?.verified_by.gov_op_id !== null ? (
                  <ShieldCheck
                    fill="#20BF55"
                    strokeWidth={1}
                    color="white"
                    size={18}
                  />
                ) : null}
              </div>
              <p className="text-xs text-left font-bold italic">
                {evacPinDetails?.is_persistent ? "Persistent" : "Temporary"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-left text-xs italic">
              Information Last Updated: {evacPinDetails?.last_updated}
            </p>
            <p className="text-left text-xs italic">
              Expires in: {daysLeft} days
            </p>
            <p className="text-left text-xs italic">
              Posted By: {evacPinDetails?.posted_by.username}
            </p>
          </div>
          <Button
            size="sm"
            className="w-30 h-8 bg-gradient-to-r bg-[#F3C962] rounded-2xl"
            id="Drawer_RouteBtn"
            onClick={() => {
              (onFindRoute?.(true), setIsExpanded?.(false));
            }}
          >
            Show Route
          </Button>
        </div>
        <div className="mt-2">
          <ul className="list-disc pl-8 text-left text-xs">
            <li>
              <b>Address</b>: {evacPinDetails?.address}
            </li>
            <li>
              <b>Area Type</b>: {evacPinDetails?.area_type}
            </li>
            <li>
              <b>Capacity</b>: {evacPinDetails?.capacity_name}
            </li>
          </ul>
        </div>
      </DrawerHeader>
      {isExpanded ? (
        <div
          className={cn(
            "overflow-auto transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Collapsible className="rounded-md data-[state=open]:bg-red px-4 ">
            <CollapsibleTrigger
              id="Drawer_FacilitiesTrigger"
              className="group w-full flex flex-col items-start"
              onClick={() => {
                setOpenCollapse(!openCollapse);
              }}
            >
              <div className="flex flex-row items-center">
                Facilities Available
                {openCollapse ? (
                  <ChevronUpIcon className="ml-auto group-data-[state=open]:rotate-180" />
                ) : (
                  <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                )}
                <p className="text-xs italic">Press to see more</p>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent
              id="Drawer_FacilitiesContent"
              className="flex flex-col items-start px-2.5 pt-0 text-sm"
            >
              <div className="flex flex-row w-full justify-evenly gap-2 pr-2.5 pt-1">
                <div className="grid grid-cols-2 w-full justify-evenly gap-2 pr-2.5 pt-1">
                  {available.map((facility) => (
                    <div
                      key={facility.key}
                      className="flex flex-1 flex-row items-center gap-1"
                    >
                      <img src={String(facility.icon)} />
                      <p className="text-xs">
                        {facility.name}{" "}
                        {facility.type === "count" &&
                        evacPinDetails?.[facility.key] !== null
                          ? ` (${evacPinDetails?.[facility.key]})`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-row items-center gap-1 ml-3"></div>
              </div>
              <p className="text-sm pt-4">Not Available</p>
              <div className="grid grid-cols-2 w-full justify-evenly gap-2 pr-2.5 pt-1">
                {unavailable.map((facility) => (
                  <div
                    key={facility.key}
                    className="flex flex-1 flex-row items-center gap-1 grayscale"
                  >
                    <img src={String(facility.icon)} />
                    <p className="text-xs">{facility.name}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm pt-4">Other Facilities</p>
              <p className="text-xs">{evacPinDetails?.other_facilities}</p>
            </CollapsibleContent>
          </Collapsible>
          {evacPinDetails?.media?.[0]?.url ? (
            <Collapsible className="rounded-md data-[state=open]:bg-muted px-4 ">
              <CollapsibleTrigger
                id="Drawer_FacilitiesTrigger"
                className="group w-full flex flex-col items-start"
                onClick={() => setOpenImageCollapse(!openImageCollapse)}
              >
                <div className="flex flex-row items-center">
                  Attached Photo
                  {openImageCollapse ? (
                    <ChevronUpIcon className="ml-auto group-data-[state=open]:rotate-180" />
                  ) : (
                    <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                  )}
                  <p className="text-xs italic">Press to see more</p>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent
                id="Drawer_FacilitiesContent"
                className="flex flex-col items-start px-2.5 pt-0 text-sm"
              >
                <img src={evacPinDetails.media[0].url} />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
          <hr className="border-gray-400 m-4"></hr>
          <div className="">
            <div className="flex flex-row items-center gap-2 px-4">
              <img src={CSIcon} className="w-12" />
              <p className="text-base">
                <b>Crowdsourced Updates</b>
              </p>
            </div>
            <div className="flex flex-col gap-2 mb-4 mt-4 pb-16 px-4">
              {commentsLoad ? (
                <div className="h-full w-full flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full bg-[#59260B]/30" />
                  <div className="w-full space-y-2 items-start justify-center">
                    <Skeleton className="h-4 w-full bg-[#59260B]/30" />
                    <Skeleton className="h-4 w-[200px] bg-[#59260B]/30" />
                  </div>
                </div>
              ) : (
                comments.map((comment) => (
                  <Fragment key={comment.id}>
                    <PostRow
                      id={comment.id}
                      username={comment.posted_by.username}
                      timePosted={convertDateTime(comment.posted_at)}
                      description={comment.content}
                      locationVerified
                      isEvacComments={true}
                      isHazardPost={false}
                      image={comment.media}
                      seed={comment.posted_by.avatar_seed}
                    />
                  </Fragment>
                ))
              )}
            </div>
            <div className="fixed bottom-0 z-100 bg-white w-full h-content">
              <div className="flex flex-col h-fit justify-center">
                <div className="h-full flex flex-row items-center p-2 gap-2">
                  {seedLoad ? (
                    <Spinner />
                  ) : (
                    <img src={dataUri} className="w-11" />
                  )}
                  <InputGroup>
                    <InputGroupInput
                      placeholder="Add a Comment"
                      id="Drawer_CommentField"
                      onChange={(e) => setNewComment(e.target.value)}
                      value={!newComment ? "" : newComment}
                    ></InputGroupInput>
                    <InputGroupAddon
                      align="inline-end"
                      onClick={handleFileClick}
                      id="Drawer_FileBtn"
                      style={{ cursor: "pointer" }}
                    >
                      <File />
                    </InputGroupAddon>
                    <InputGroupAddon
                      align="inline-end"
                      id="Drawer_CameraBtn"
                      onClick={handleCameraClick}
                      style={{ cursor: "pointer" }}
                    >
                      <Camera />
                    </InputGroupAddon>
                    <input
                      style={{ display: "none" }}
                      type="file"
                      onChange={fileOnChange}
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/heic"
                      id="Drawer_FileInput"
                    />
                    {/* To test when PWA is done  */}
                    <input
                      style={{ display: "none" }}
                      type="file"
                      onChange={fileOnChange}
                      ref={cameraInputRef}
                      capture
                      accept="image/png, image/jpeg, image/heic"
                      id="Drawer_CameraTrigger"
                    />
                  </InputGroup>
                </div>
                {image && (
                  <div className="flex flex-col gap-1 p-2">
                    <button
                      onClick={handleClearImage}
                      id="Drawer_ClearImageBtn"
                      className="flex self-end"
                    >
                      <X size={14} />
                    </button>
                    <img src={imagePreview} />
                  </div>
                )}
                {(newComment || image) && (
                  <div className="mx-2 mb-2 flex justify-center">
                    <ButtonComp
                      text="Post"
                      variant="primary"
                      id="Drawer_PostCommentBtn"
                      widthSize="100%"
                      onClick={(e) => submitComment(e)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default EvacPinDrawer;
