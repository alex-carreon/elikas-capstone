import { Phone, Search, Filter } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import HotlineRow from "../components/HotlineRow";
// import { Button } from "@/components/ui/button";

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
        {/* Search and Filter and Add button */}
        <div className="w-full max-w-md flex flex-row justify-between">
          <div>
            {/* <Button
              size="sm"
              className="w-24 bg-gradient-to-r from-[#FFA011] to-[#F3C962]"
              id="Hotlines-Add"
            >
              Add Hotline
            </Button> */}
          </div>
          <div className="flex justify-end items-center gap-2">
            <InputGroup className="w-2/3">
              <InputGroupInput
                className="text-sm h-8"
                id="Hotlines_Search"
              ></InputGroupInput>
              <InputGroupAddon align="inline-end">
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <Filter size={18} id="Hotlines_FilterBtn" />{" "}
          </div>
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
