import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CircleX } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ButtonComp from "./Button";
import colors from "@/constants/colors";
import { Link } from "react-router";
import HazardDrawer from "./DrawerContent/HazardDrawer";
import EvacPinDrawer from "./DrawerContent/EvacPinDrawer";
import SensorDrawer from "./DrawerContent/SensorDrawer";

type FloodLevel = {
  id: number;
  level_name: string;
};

type FloodPath = {
  id: number;
  is_expired: boolean;
  is_deactivated: boolean;
  level: FloodLevel;
  path: [number, number][];
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
  role: string;
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

type Sensors = {
  id: number;
  name: string;
  location: [number, number];
  water_level: any | null;
  last_only: any | null;
  current_status: string;
};

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFloodPin: FloodPath | null;
  selectedEvacPin: EvacPin | null;
  selectedSensorPin: Sensors | null;
  onFindRoute: (findRoute: boolean) => void;
  newPin: boolean;
  isSensor: boolean;
  isHazard: boolean;
}

function DrawerComp({
  open,
  onOpenChange,
  selectedFloodPin,
  selectedEvacPin,
  selectedSensorPin,
  onFindRoute,
  newPin,
  isSensor,
  isHazard,
}: DrawerProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  if (!selectedFloodPin) return null;

  let content;
  if (newPin) {
    content = (
      <>
        <div className="px-4 pb-6">
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
        <SensorDrawer selectedPin={selectedSensorPin} />
      </>
    );
  } else if (isHazard) {
    content = (
      <>
        <HazardDrawer selectedPin={selectedFloodPin} />
      </>
    );
  } else {
    content = (
      <>
        <EvacPinDrawer
          selectedPin={selectedEvacPin!}
          onFindRoute={onFindRoute}
          setIsExpanded={setExpanded}
          isExpanded={expanded}
        />
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
            expanded ? "h-content" : isHazard ? "h-content" : "h-content",
          )}
          id="Drawer_DrawerContent"
        >
          <DrawerTitle />
          <DrawerDescription />
          {content}
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default DrawerComp;
