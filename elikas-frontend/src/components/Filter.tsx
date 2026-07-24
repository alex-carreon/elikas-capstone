import { Diamond, ListFilterIcon, MapPin } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@base-ui/react";
import { useState } from "react";
import { useMapFilterContext } from "@/context/MapFilterContext";
import colors from "@/constants/colors";

function Filter() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    showPaths,
    setShowPaths,
    showGovPins,
    setShowGovPins,
    setShowOtherPins,
    showOtherPins,
  } = useMapFilterContext();

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="absolute max-w-md right-0"
    >
      <div className="flex items-center justify-end mx-4 mt-4 mb-2">
        <CollapsibleTrigger id="Map_FilterTrigger">
          <div className="w-fit p-1 px-5 bg-white shadow-xl rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-100">
            <span className="flex gap-2 items-center text-sm font-medium">
              <ListFilterIcon size={14} strokeWidth={2} /> Filter
            </span>
          </div>
        </CollapsibleTrigger>
      </div>
      <div className="flex justify-end">
        <CollapsibleContent
          className="size-fit flex flex-col gap-2 bg-white mr-4 p-3 rounded-md"
          id="Map_FilterContent"
        >
          <div className="text-xs">
            <p className="font-bold">Show Evacuation Sites</p>
          </div>
          <div className="text-xs flex flex-row gap-2 items-center ml-4">
            <Switch
              id="MapFilter_Barangay"
              size="default"
              checked={showGovPins}
              onCheckedChange={setShowGovPins}
            />
            <p className="">By Barangay</p>
          </div>
          <div className="text-xs flex flex-row gap-2 items-center ml-4">
            <Switch
              id="MapFilter_User"
              size="default"
              checked={showOtherPins}
              onCheckedChange={setShowOtherPins}
            />
            <p className="">By Other Users</p>
          </div>
          <Separator className="border-t border-gray-800/10" />
          <div className="text-xs">
            <p className="font-bold">Show Flooded Roads</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4">
            <Switch
              id="MapFilter_Hazard"
              size="default"
              checked={showPaths}
              onCheckedChange={setShowPaths}
            />
            <p>All Flooded Roads</p>
          </div>
          <Separator className="border-t border-gray-800/10" />
          <div className="text-xs">
            <p className="font-bold">Legends</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs flex flex-row gap-2 ml-4 items-center">
              <MapPin size={24} fill={colors.activeIcon} stroke="white" />
              <p>Evac Pins</p>
            </div>
            <div className="text-xs flex flex-row gap-2 ml-4 items-center">
              <MapPin size={24} fill="#59260b" stroke="white" />
              <p>Own Evac Pins</p>
            </div>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-5 items-center">
            <div className="rounded-3xl w-4 h-4 bg-[#5f80aa]" />
            <p className="ml-1">Flood Pins</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-5 items-center">
            <div className="rounded-3xl w-4 h-4 bg-[#FFA011]" />
            <p className="ml-1">Own Flood Pins</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4 items-center">
            <div className="bg-[#52B2DA] rounded-2xl w-6 h-2" />
            <p>Light Flooding</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4 items-center">
            <div className="bg-[#578EC2] rounded-2xl w-6 h-2  " />
            <p>Moderate Flooding</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4 items-center">
            <div className="bg-[#B22B42] rounded-2xl w-6 h-2  " />
            <p>Heavy Flooding</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4.5 items-center">
            <Diamond size={22} fill="#318631" stroke="white" />
            <p>Normal River Level</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4.5 items-center">
            <Diamond size={22} fill="#F3C217" stroke="white" />
            <p>Alert River Level</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4.5 items-center">
            <Diamond size={22} fill="#E6793B" stroke="white" />
            <p>Prepare River Level</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4.5 items-center">
            <Diamond size={22} fill="#B22B42" stroke="white" />
            <p>Evacuate River Level</p>
          </div>
          <div className="text-xs flex flex-row gap-2 ml-4.5 items-center">
            <Diamond size={22} fill="#6E4998" stroke="white" />
            <p>Overflow River Level</p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default Filter;
