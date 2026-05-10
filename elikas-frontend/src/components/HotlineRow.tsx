import { PinIcon, Smartphone, Copy, Phone, Edit } from "lucide-react";
function HotlineRow() {
  return (
    <div>
      <p className="italic text-xs">Last Update: Feb 10, 2026</p>
      <div className="bg-[#FFE6A9] p-4 rounded-xl border-black border-solid border-1 flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <p>
            <b>Medical and Health</b>
          </p>
          <Copy />
          {/* <Edit /> */}
        </div>
        <div className="flex flex-row text-sm items-center">
          <PinIcon fill="red" strokeWidth={0.5} size={20} />
          <p>Beside Municipal Hall</p>
        </div>
        <div className="flex flex-row text-sm items-center">
          <Phone fill="gray" strokeWidth={0.5} size={20} />
          <p>(02) 8854-2211</p>
        </div>
        <div className="flex flex-row text-sm items-center">
          <Smartphone strokeWidth={2} size={20} />
          <p>0917-456-7890</p>
        </div>
        <p className="flex italic text-xs justify-end">Posted by Admin</p>
      </div>
    </div>
  );
}

export default HotlineRow;
