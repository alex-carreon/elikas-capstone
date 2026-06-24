import { useUserContext } from "@/context/AuthContext";
import { Separator } from "@base-ui/react";
import { MapPin, Smartphone, Phone, Copy, Edit, CopyCheck } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router";

interface HotlineRowProps {
  lastUpdate: string;
  name: string;
  address: string;
  primary: string;
  secondary: string;
  postedBy: string;
  id: number;
}

function HotlineRow({
  lastUpdate,
  name,
  address,
  primary,
  secondary,
  postedBy,
  id,
}: HotlineRowProps) {
  const [copy, setCopy] = useState(false);

  const { role } = useUserContext();

  const HandleCopy = () => {
    const fallback = () => {
      const el = document.createElement("textarea");
      el.value = primary;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(primary).catch(fallback);
    } else {
      fallback();
    }

    setCopy(true);
    toast("Copied to clipboard");
    setTimeout(() => setCopy(false), 2000);
  };

  return (
    <Fragment key={id}>
      <div className="w-full max-w-sm">
        <p className="italic text-xs">Last Update: {lastUpdate}</p>
        <div className="bg-[#FFE6A9] p-4 rounded-xl shadow-xl border-solid border-1 border-amber-300 flex flex-col gap-2">
          <div className="flex flex-row justify-between gap-2">
            <p>
              <b>{name}</b>
            </p>
            {role === "brgy_op" ? (
              <Link to={`/HotlinesForm/${id}`}>
                <Edit className="p-2" size={38} />
              </Link>
            ) : copy ? (
              <button
                id="Hotlines_CopyCheckBtn"
                className="p-2 cursor-default"
                disabled
              >
                <CopyCheck size={24} />
              </button>
            ) : (
              <button
                id="Hotlines_CopyBtn"
                className="p-2 cursor-default"
                onClick={HandleCopy}
                type="button"
              >
                <Copy size={24} />
              </button>
            )}
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
          <p className="flex italic text-xs justify-end">
            Posted by: {postedBy}
          </p>
        </div>
      </div>
    </Fragment>
  );
}

export default HotlineRow;
