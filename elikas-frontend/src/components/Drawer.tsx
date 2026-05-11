import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { ChevronDownIcon, ShieldCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ButtonComp from "./Button";
import DrawerIcon from "@/assets/Map/Drawer.svg";
import AccoIcon from "@/assets/Map/AccomodationIcon.svg";
import CrIcon from "@/assets/Map/CrIcon.svg";
import CSIcon from "@/assets/Map/CrowdsourceIcon.svg";
import Photo from "@/assets/Map/SamplePhoto.png";
import PostRow from "./PostRow";

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
}

function DrawerComp({ open, onOpenChange, selectedPin }: DrawerProps) {
  const [expanded, setExpanded] = useState(false);
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
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
      >
        <div className="flex justify-center gap-2">
          <ButtonComp
            text={expanded ? "Press to Collapse" : "Press to Expand"}
            id="Drawer-Handle"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
          ></ButtonComp>
          <DrawerClose>
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <DrawerHeader>
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
          <div className="mt-4">
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
            "px-4 overflow-auto transition-opacity duration-300",
            expanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Collapsible className="rounded-md data-[state=open]:bg-muted">
            <CollapsibleTrigger>
              <Button variant="ghost" className="group w-full">
                Facilities Available
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                <p className="text-xs italic">Press to see more</p>
              </Button>
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
            <CollapsibleContent className="flex flex-col items-start px-2.5 pt-0 text-sm">
              <div className="flex flex-row w-full gap-7">
                <div className="flex flex-row items-center gap-1">
                  <img src={AccoIcon} />
                  <p className="text-xs">Accomodation</p>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <img src={CrIcon} />
                  <p className="text-xs">Comfort Room</p>
                </div>
              </div>
              <p className="text-sm pt-4">Not Available</p>
              <div className="flex flex-row w-full gap-7 mt-2">
                <div className="flex flex-row items-center gap-1">
                  <img src={AccoIcon} />
                  <p className="text-xs">Accomodation</p>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <img src={CrIcon} />
                  <p className="text-xs">Comfort Room</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <hr className="border-gray-400 m-4"></hr>
          <div className="px-2.5">
            <div className="flex flex-row items-center gap-2">
              <img src={CSIcon} className="w-12" />
              <p className="text-base">
                <b>Crowdsourced Updates</b>
              </p>
            </div>
            <div className="flex flex-col gap-2 mb-4">
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default DrawerComp;
