import { Separator } from "@base-ui/react";
import {
  MapPin,
  Smartphone,
  Phone,
  Copy,
  // Edit,
  CopyCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface HotlineRowProps {
  lastUpdate: string;
  name: string;
  address: string;
  primary: string;
  secondary: string;
  postedBy: string;
}

function HotlineRow({
  lastUpdate,
  name,
  address,
  primary,
  secondary,
  postedBy,
}: HotlineRowProps) {
  const [copy, setCopy] = useState(false);

  const HandleCopy = () => {
    navigator.clipboard.writeText(primary);
    setCopy(true);
    toast("Copied to clipboard");
    setTimeout(() => setCopy(false), 2000);
  };

  return (
    <div className="">
      <p className="italic text-xs">Last Update: {lastUpdate}</p>
      <div className="bg-[#FFE6A9] p-4 rounded-xl shadow-xl border-solid border-1 border-amber-300 flex flex-col gap-2">
        <div className="flex flex-row justify-between gap-2">
          <p>
            <b>{name}</b>
          </p>
          {copy ? (
            <CopyCheck id="Hotlines_CopyBtn" className="p-2" size={24} />
          ) : (
            <Copy
              id="Hotlines_CopyBtn"
              className="p-2"
              onClick={HandleCopy}
              size={38}
            />
          )}
          {/* <Edit /> */}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row text-sm items-center gap-1">
            <MapPin strokeWidth={2} size={16} />
            <p className="text-sm">{address}</p>
          </div>
          <div className="flex flex-row text-sm items-center gap-1">
            <Phone strokeWidth={2} size={16} />
            <p className="text-sm">{primary}</p>
          </div>
          <div className="flex flex-row text-sm items-center gap-1">
            <Smartphone strokeWidth={2} size={16} />
            <p className="text-sm">{secondary}</p>
          </div>
        </div>
        <Separator className="border-t border-gray-800/10 mt-2 pt-2" />
        <p className="flex italic text-xs justify-end">Posted by: {postedBy}</p>
      </div>
    </div>
  );
}

export default HotlineRow;
