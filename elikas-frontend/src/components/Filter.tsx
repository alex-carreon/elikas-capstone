import { ListFilterIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@base-ui/react";
import { useState } from "react";
import { useMapFilterContext } from "@/context/MapFilterContext";

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
      className="fixed w-full max-w-md z-1"
    >
      <div className="flex items-center justify-end m-4">
        <CollapsibleTrigger id="Map_FilterTrigger">
          <div className="size-8 bg-white rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-100">
            <ListFilterIcon strokeWidth={3} />
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
              size="sm"
              checked={showGovPins}
              onCheckedChange={setShowGovPins}
            />
            <p className="">By Barangay</p>
          </div>
          <div className="text-xs flex flex-row gap-2 items-center ml-4">
            <Switch
              id="MapFilter_User"
              size="sm"
              checked={showOtherPins}
              onCheckedChange={setShowOtherPins}
            />
            <p className="">By Other Users</p>
          </div>
          <Separator />
          <div className="text-xs flex flex-row gap-2">
            <Switch
              id="MapFilter_Hazard"
              size="sm"
              checked={showPaths}
              onCheckedChange={setShowPaths}
            />
            <p className="font-bold">Show Flooded Roads</p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default Filter;
