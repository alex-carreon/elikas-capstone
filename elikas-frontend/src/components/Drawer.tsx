import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ChevronDownIcon,
  ShieldCheck,
  CircleX,
  File,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import ButtonComp from "./Button";
import DrawerIcon from "@/assets/Map/Drawer.svg";
import AccoIcon from "@/assets/Map/AccomodationIcon.svg";
import CrIcon from "@/assets/Map/CrIcon.svg";
import CSIcon from "@/assets/Map/CrowdsourceIcon.svg";
import Photo from "@/assets/Map/SamplePhoto.png";
import PostRow from "./PostRow";
import colors from "@/constants/colors";
import { Link } from "react-router";
import SensorIconDetailed from "./SensorIconDetailed";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

interface Pin {
  id: number;
  name: string;
  description: string;
  lat: number;
  long: number;
}

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPin: Pin | null;
  onFindRoute: (findRoute: boolean) => void;
  newPin: boolean;
  isSensor: boolean;
}

function DrawerComp({
  open,
  onOpenChange,
  selectedPin,
  onFindRoute,
  newPin,
  isSensor,
}: DrawerProps) {
  const [expanded, setExpanded] = useState(false);
  const [verified, setVerified] = useState(false);
  const [color, setColor] = useState("");
  const [height, setHeight] = useState(0);
  const [risk, setRisk] = useState("");
  const [desc, setDesc] = useState("");
  const [seed, setSeed] = useState("Felix");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log(comment);
    console.log(image);
  };

  const colorSensor = {
    yellow: "#F3C217",
    orange: "#E6793B",
    red: "#B22B42",
    purple: "#6E4998",
  };

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
      console.log(fileInputRef.current);
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    setHeight(40);
  });

  useEffect(() => {
    if (height >= 40) {
      // Overflow
      setColor(colorSensor.purple);
      setRisk("Overflow");
      setDesc(
        "Water has exceeded safe levels and is overflowing. Avoid flood-prone areas and follow emergency instructions.",
      );
    } else if (height >= 30) {
      // Critical
      setColor(colorSensor.red);
      setRisk("Critical");
      setDesc(
        "Flooding is imminent or ongoing. Evacuate immediately to higher ground.",
      );
    } else if (height >= 20) {
      // Alarm
      setColor(colorSensor.orange);
      setRisk("Alarm");
      setDesc(
        "Water levels are significantly elevated. Prepare for possible evacuation and secure belongings.",
      );
    } else if (height >= 10) {
      // Alert
      setColor(colorSensor.yellow);
      setRisk("Alert");
      setDesc(
        "Water levels are rising. Monitor the situation closely and stay informed of updates.",
      );
    }
  }, [height]);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

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

  let content;

  if (newPin) {
    content = (
      <>
        <div className="px-4">
          <DrawerClose
            id="DrawerMark_CloseBtn"
            className="w-full flex justify-end"
          >
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
          <div className="flex items-center gap-3 flex-col">
            <p className="text-lg font-bold" style={{ color: colors.heading }}>
              Mark this Location
            </p>
            <Link to="/EvacForm" className="w-full flex justify-center">
              <ButtonComp
                text="Mark as Evacuation Site"
                variant="primary"
                id="Drawer_MarkEvacBtn"
                widthSize="90%"
                heightSize="44px"
              ></ButtonComp>
            </Link>
            <Link to="/HazardForm" className="w-full flex justify-center">
              <ButtonComp
                text="Mark as Road Hazard"
                variant="outline"
                id="Drawer_MarkRoadBtn"
                widthSize="90%"
                heightSize="40px"
              ></ButtonComp>
            </Link>
          </div>
        </div>
      </>
    );
  } else if (isSensor) {
    content = (
      <>
        <div className="px-4">
          <div className="w-full flex flex-row justify-between">
            <div className="flex flex-row gap-2">
              <SensorIconDetailed width={50} height={50} color={color} />
              <div>
                <div className="flex flex-row">
                  <p className="text-lg font-semibold">{selectedPin?.name}</p>
                  {verified ? (
                    <ShieldCheck
                      fill="#20BF55"
                      strokeWidth={1}
                      color="white"
                      size={18}
                    />
                  ) : null}
                </div>
                <p className="text-xs text-left font-semibold italic">
                  Timestamp: Mar 25, 2026 – 9:42 PM
                </p>
              </div>
            </div>
            <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
              <CircleX size={28} fill="#CECECE" strokeWidth={1} />
            </DrawerClose>
          </div>
          <div className="mt-2">
            <ul className="list-disc pl-8 text-left text-sm flex flex-col gap-1">
              <li>
                <b>Sensor ID</b>: SJ-RIVER-01
              </li>
              <li>
                <b>Water Height in Meters</b>: {height}
              </li>
              <li>
                <b>Risk Level</b>: {risk}
              </li>
              <p>{desc}</p>
            </ul>
          </div>
        </div>
      </>
    );
  } else {
    content = (
      <>
        <div className="flex justify-between px-4">
          <ButtonComp
            text={expanded ? "Press to Collapse" : "Press to Expand"}
            id="DrawerInfo_ExpandCollapse"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            widthSize="40"
          ></ButtonComp>
          <DrawerClose id="DrawerInfo_Close">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <DrawerHeader>
          <DrawerTitle>
            <DrawerDescription />
          </DrawerTitle>
          <div className="flex flex-row gap-2">
            <img src={DrawerIcon} className="w-10" />
            <div>
              <div className="flex flex-row">
                <p className="text-lg font-semibold">{selectedPin?.name}</p>
                {verified ? (
                  <ShieldCheck
                    fill="#20BF55"
                    strokeWidth={1}
                    color="white"
                    size={18}
                  />
                ) : null}
              </div>
              <p className="text-xs text-left font-semibold italic">
                Persistent
              </p>
            </div>
          </div>
          <p className="text-left text-xs italic">
            Information Last Updated by 01/01/26
          </p>
          <Button
            size="sm"
            className="w-30 h-8 bg-gradient-to-r bg-[#F3C962] rounded-2xl"
            id="Drawer_RouteBtn"
            onClick={() => {
              (onFindRoute(true), setExpanded(false));
            }}
          >
            Show Route
          </Button>
          <div className="mt-2">
            <ul className="list-disc pl-8 text-left text-xs">
              <li>
                <b>Address</b>: Purok 3, San Isidro, near Barangay Hall
              </li>
              <li>
                <b>Arrive in</b>: 25 minutes
              </li>
            </ul>
          </div>
        </DrawerHeader>
        <div
          className={cn(
            "overflow-auto transition-opacity duration-300",
            expanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Collapsible className="rounded-md data-[state=open]:bg-muted px-4 ">
            <CollapsibleTrigger
              id="Drawer_FacilitiesTrigger"
              className="group w-full flex flex-col items-start"
            >
              <div className="flex flex-row items-center">
                Facilities Available
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                <p className="text-xs italic">Press to see more</p>
              </div>
              <div className="flex flex-row w-full justify-evenly gap-2 px-2.5 pt-1">
                <div className="flex flex-1 flex-row items-center gap-1">
                  <img src={AccoIcon} />
                  <p className="text-xs">Accomodation</p>
                </div>
                <div className="flex flex-1 flex-row items-center gap-1">
                  <img src={CrIcon} />
                  <p className="text-xs">Comfort Room</p>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent
              id="Drawer_FacilitiesContent"
              className="flex flex-col items-start px-2.5 pt-0 text-sm"
            >
              <div className="flex flex-row w-full justify-evenly gap-2 pr-2.5 pt-1">
                <div className="flex flex-1 flex-row items-center gap-1">
                  <img src={AccoIcon} />
                  <p className="text-xs">Accomodation</p>
                </div>
                <div className="flex flex-1 flex-row items-center gap-1 ml-3">
                  <img src={CrIcon} />
                  <p className="text-xs">Comfort Room</p>
                </div>
              </div>
              <p className="text-sm pt-4">Not Available</p>
              <div className="flex flex-row w-full justify-evenly gap-2 pr-2.5 pt-1">
                <div className="flex flex-1 flex-row items-center gap-1">
                  <img src={AccoIcon} />
                  <p className="text-xs">Accomodation</p>
                </div>
                <div className="flex flex-1 flex-row items-center gap-1 ml-3">
                  <img src={CrIcon} />
                  <p className="text-xs">Comfort Room</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <hr className="border-gray-400 m-4"></hr>
          <div className="">
            <div className="flex flex-row items-center gap-2 px-4">
              <img src={CSIcon} className="w-12" />
              <p className="text-base">
                <b>Crowdsourced Updates</b>
              </p>
            </div>
            <div className="flex flex-col gap-2 mb-4 mt-4 pb-16 px-4">
              {/* Post Row */}
              <PostRow
                username="Kurt Hacinas"
                timePosted="3:30pm"
                description="Bring your own water"
                locationVerified
                upVotesCount={20}
                downVotesCount={12}
                flagCount={1}
                expiryDays={30}
                image={Photo}
              />
              <PostRow
                username="Kurt Hacinas"
                timePosted="3:30pm"
                description="Bring your own water"
                locationVerified
                upVotesCount={20}
                downVotesCount={12}
                flagCount={1}
                expiryDays={30}
                image={Photo}
              />
              {/* Post Row */}
            </div>
            {expanded ? (
              <div className="fixed bottom-0 z-100 bg-white w-full h-content">
                <div className="h-full flex flex-row items-center p-2 gap-2">
                  <img src={dataUri} className="w-11" />
                  <InputGroup>
                    <InputGroupInput
                      placeholder="Add a Comment"
                      id="Drawer_CommentField"
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
                    />
                    {/* To test when PWA is done */}
                    <input
                      style={{ display: "none" }}
                      type="file"
                      onChange={fileOnChange}
                      ref={cameraInputRef}
                      capture
                      accept="image/png, image/jpeg, image/heic"
                    />
                  </InputGroup>
                </div>
                {image && (
                  <div className="p-4 flex flex-col gap-3">
                    <img src={imagePreview} />
                    <ButtonComp
                      text="Clear"
                      variant="outline"
                      id="EvacPin_ImageClearBtn"
                      onClick={handleClearImage}
                    ></ButtonComp>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        modal={false}
        shouldScaleBackground={false}
      >
        <DrawerContent
          className={cn(
            "transition-all duration-300 inset-x-0 mx-auto w-full max-w-md",
            expanded ? "h-[80vh]" : "h-[240px]",
          )}
          id="Drawer_DrawerContent"
        >
          {content}
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default DrawerComp;
