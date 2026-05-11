import { Phone, Search, Filter } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import HotlineRow from "./components/HotlineRow";

function Hotlines() {
  return (
    <>
      <div className="w-full h-screen flex flex-col items-center p-6 mt-8 gap-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-1 mt-6">
          <Phone />
          <p>
            <b>Emergency Hotline Directory</b>
          </p>
        </div>
        {/* Search and Filter */}
        <div className="w-full max-w-md flex justify-end items-center gap-2">
          <InputGroup className="w-1/2">
            <InputGroupInput className="text-sm h-8"></InputGroupInput>
            <InputGroupAddon align="inline-end">
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <Filter size={18} />
        </div>
        {/* Hotline rows */}
        <div className="w-full max-w-md flex flex-col justify-start gap-4">
          <HotlineRow />
          <HotlineRow />
          <HotlineRow />
        </div>
      </div>
    </>
  );
}

export default Hotlines;
