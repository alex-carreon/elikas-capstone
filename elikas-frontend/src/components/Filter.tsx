import { ListFilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@base-ui/react";
import { useState } from "react";

function Filter() {
  const [isOpen, setIsOpen] = useState(false);
  const [barangayFilter, setBarangayFilter] = useState(true);
  const [userFilter, setUserFilter] = useState(true);
  const [hazardFilter, setHazardFilter] = useState(true);

  const handleBarangayToggle = () => {
    //Filter endpoint
  };

  const handleUserToggle = () => {
    //Filter endpoint
  };

  const handleHazardToggle = () => {
    //Filter endpoint
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed w-full max-w-md z-1"
    >
      <div className="flex items-center justify-end m-4">
        <CollapsibleTrigger>
          <Button size="icon" className="size-8 bg-white">
            <ListFilterIcon strokeWidth={3} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="flex justify-end">
        <CollapsibleContent className="size-fit flex flex-col gap-2 bg-white mr-4 p-3 rounded-md">
          <div className="text-xs">
            <p className="font-bold">Show Evacuation Sites</p>
          </div>
          <div className="text-xs flex flex-row gap-2 items-center ml-4">
            <Switch
              id="MapFilter_Barangay"
              size="sm"
              checked={barangayFilter}
              onCheckedChange={handleBarangayToggle}
            />
            <p className="">By Barangay</p>
          </div>
          <div className="text-xs flex flex-row gap-2 items-center ml-4">
            <Switch
              id="MapFilter_User"
              size="sm"
              checked={userFilter}
              onCheckedChange={handleUserToggle}
            />
            <p className="">By Other Users</p>
          </div>
          <Separator />
          <div className="text-xs flex flex-row gap-2">
            <Switch
              id="MapFilter_Hazard"
              size="sm"
              checked={hazardFilter}
              onCheckedChange={handleHazardToggle}
            />
            <p className="font-bold">Show Flooded Roads</p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default Filter;
