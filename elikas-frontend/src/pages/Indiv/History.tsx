import colors from "@/constants/colors";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Row from "@/components/Row";
import { Filter, Search } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";

function History() {
  // const location = useLocation();

  const [evacPins, setEvacPins] = useState(true);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);

  return (
    <div className=" overflow-hidden h-screen flex justify-center pt-20 p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <p className="font-bold text-2xl" style={{ color: colors.heading }}>
          Pin History
        </p>
        <div className="flex flex-col justify-center items-center gap-2">
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            <TabsList className="w-full flex justify-between">
              <TabsTrigger value="Evacuation" onClick={() => setEvacPins(true)}>
                Evacuation Pins
              </TabsTrigger>
              <TabsTrigger value="Hazard" onClick={() => setEvacPins(false)}>
                Hazard Pins
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            {evacPins ? (
              <TabsList variant="line" className="w-full flex justify-between">
                <TabsTrigger
                  value="ActiveEvac"
                  onClick={() => setActiveEvac(true)}
                >
                  Active Pins
                </TabsTrigger>
                <TabsTrigger
                  value="ClosedEvac"
                  onClick={() => setActiveEvac(false)}
                >
                  Closed Pins
                </TabsTrigger>
              </TabsList>
            ) : (
              <TabsList variant="line" className="w-full flex justify-between">
                <TabsTrigger
                  value="ActiveHaz"
                  onClick={() => setActiveHaz(true)}
                >
                  Active Pins
                </TabsTrigger>
                <TabsTrigger
                  value="ExpiredHaz"
                  onClick={() => setActiveHaz(false)}
                >
                  Expired Pins
                </TabsTrigger>
              </TabsList>
            )}
          </Tabs>
        </div>
        <div className="flex justify-end items-center gap-2">
          <InputGroup className="w-2/3">
            <InputGroupInput
              className="text-sm h-8"
              id="Pins_Search"
            ></InputGroupInput>
            <InputGroupAddon align="inline-end">
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <Filter size={18} id="Pins_FilterBtn" />
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-screen">
          {evacPins ? (
            activeEvac ? (
              <Row
                postId="123"
                title="Home"
                address="Blk 123 Lot 2 Avenue street"
                datePosted="March 13, 2005"
                availability
                isAvailable
              />
            ) : (
              <Row
                postId="123"
                title="Home"
                address="Blk 123 Lot 2 Avenue street"
                datePosted="March 13, 2005"
                availability
              />
            )
          ) : activeHaz ? (
            <Row
              postId="123"
              title="Home"
              address="Blk 123 Lot 2 Avenue street"
              datePosted="March 13, 2005"
            />
          ) : (
            <Row
              postId="123"
              title="Home"
              address="Blk 123 Lot 2 Avenue street"
              datePosted="March 13, 2005"
              isExpired
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default History;
