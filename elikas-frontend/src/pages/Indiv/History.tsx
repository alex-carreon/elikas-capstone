import colors from "@/constants/colors";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import Row from "@/components/Row";
import { Filter, Search } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import api from "@/api";
import { useUserContext } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import ButtonComp from "@/components/Button";
import { Link } from "react-router";

type FloodLevel = {
  id: number;
  level_name: string;
};

type myFloodPaths = {
  description: string;
  id: number;
  is_deactivated: boolean;
  is_expired: boolean;
  last_confirmed: string;
  level: FloodLevel;
  posted_at: string;
  posted_by: string;
};

type myEvacPins = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  expiry: string;
  is_expired: boolean;
  is_deactivated: boolean;
  deactivated_at: string | null;
  posted_at: string;
  // last_updated: string | null;
  last_confirmed: string | null;
};

type SensorsDetails = {
  id: number;
  sensorCode: string;
  name: string;
  waterLevel: any | null;
  lastOnline: any | null;
  mountHeight: number;
  location: [number, number];
  address: string;
  yellowLevel: number;
  redLevel: number;
  currentStatus: string;
  mountLocation: string;
  deactivatedAt: any | null;
  registeredBy: string;
};

function History() {
  // const location = useLocation();
  const { role } = useUserContext();

  const [isEvac, setIsEvac] = useState(true);
  const [isSensors, setIsSensors] = useState(false);
  const [sensors, setSensors] = useState<SensorsDetails[]>([]);
  const [evacPins, setEvacPins] = useState<myEvacPins[]>([]);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [floodPaths, setFloodPaths] = useState<myFloodPaths[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getMyPins = async () => {
      try {
        setLoading(true);
        const [floodResponse, evacResponse, sensorsResponse] =
          await Promise.all([
            api.get("/flood-paths/my"),
            api.get("/evacpins/users?own_pins=true"),
            api.get("/sensors?is_active=1"),
          ]);

        console.log(floodResponse);

        if (!floodResponse || !evacResponse) {
          console.log("Failed to retrieve data");
        }
        const myHazards = await floodResponse.data.flood_paths;
        const myEvacs = await evacResponse.data.pins;
        const mySensors = await sensorsResponse.data.data;
        setFloodPaths(myHazards);
        setEvacPins(myEvacs);
        setSensors(mySensors);
      } catch (err: string | any) {
        Error(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    getMyPins();
  }, []);

  return (
    <div className=" overflow-hidden h-screen flex justify-center pt-20 p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <p className="font-bold text-2xl" style={{ color: colors.heading }}>
          Pin History
        </p>
        {loading ? (
          <>
            <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
              <div className="flex flex-row gap-3 justify-between mx-8">
                <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
                <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
              </div>
              <div className="flex flex-row gap-3 justify-between mx-8">
                <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
                <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
              </div>
              <div className="flex flex-col gap-3 items-end">
                <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full bg-[#59260B]/30" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full bg-[#59260B]/30" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full bg-[#59260B]/30" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col justify-center items-center gap-2">
              <Tabs
                defaultValue="overview"
                className="w-full max-w-md flex items-center"
              >
                <TabsList className="w-full flex justify-between">
                  <TabsTrigger
                    value="Evacuation"
                    onClick={() => {
                      setIsEvac(true);
                      setIsSensors(false);
                    }}
                    id="History_EvacTrigger"
                  >
                    Evacuation Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="Hazard"
                    onClick={() => {
                      setIsEvac(false);
                      setIsSensors(false);
                    }}
                    id="History_HazardTrigger"
                  >
                    Hazard Pins
                  </TabsTrigger>
                  {role === "brgy_op" && (
                    <TabsTrigger
                      value="Sensors"
                      onClick={() => {
                        setIsEvac(false);
                        setIsSensors(true);
                      }}
                      id="History_HazardTrigger"
                    >
                      Sensors
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
              <Tabs
                defaultValue="overview"
                className="w-full max-w-md flex items-center"
              >
                {isEvac && !isSensors ? (
                  <TabsList
                    variant="line"
                    className="w-full flex justify-between"
                    id="History_EvacTabs"
                  >
                    <TabsTrigger
                      value="ActiveEvac"
                      id="History_ActiveEvacTrigger"
                      onClick={() => setActiveEvac(true)}
                    >
                      Active Pins
                    </TabsTrigger>
                    <TabsTrigger
                      value="ExpiredEvac"
                      id="History_ExpiredEvacTrigger"
                      onClick={() => setActiveEvac(false)}
                    >
                      Expired Pins
                    </TabsTrigger>
                  </TabsList>
                ) : !isEvac && !isSensors ? (
                  <TabsList
                    variant="line"
                    className="w-full flex justify-between"
                    id="History_HazardTabs"
                  >
                    <TabsTrigger
                      value="ActiveHaz"
                      id="History_ActiveHazardTrigger"
                      onClick={() => setActiveHaz(true)}
                    >
                      Active Pins
                    </TabsTrigger>
                    <TabsTrigger
                      value="ExpiredHaz"
                      id="History_ExpiredHazardTrigger"
                      onClick={() => setActiveHaz(false)}
                    >
                      Expired Pins
                    </TabsTrigger>
                  </TabsList>
                ) : null}
              </Tabs>
            </div>
            <div className="flex justify-between items-center">
              {isSensors && (
                <>
                  <Collapsible className="w-full flex flex-col justify-end rounded-md mt-2">
                    <CollapsibleTrigger
                      onClick={() => setOpenCollapse(!openCollapse)}
                      id="History_FiltersTrigger"
                    >
                      <div className="w-full flex flex-row justify-end mb-2">
                        Filters
                        {openCollapse ? (
                          <ChevronUpIcon className="ml-2 group-data-[state=open]:rotate-180" />
                        ) : (
                          <ChevronDownIcon className="ml-2 group-data-[state=open]:rotate-180" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent
                      id="History_FiltersContent"
                      className="flex flex-col items-center  px-2.5 pt-0 text-sm"
                    >
                      <div className="w-full gap-2 bg-gray-300/50 p-4 rounded-lg">
                        <div className="flex flex-row items-center gap-2">
                          <Toggle
                            size="sm"
                            variant="outline"
                            className="aria-pressed:bg-yellow-500/50 aria-pressed:text-white border-gray-400"
                            onPressedChange={setYellow}
                            pressed={yellow}
                            id="History_YellowFilter"
                          >
                            <p className="m-2 group-aria-pressed/toggle:text-black">
                              Yellow
                            </p>
                          </Toggle>
                          <Toggle
                            size="sm"
                            variant="outline"
                            className="aria-pressed:bg-orange-500/50 aria-pressed:text-white border-gray-400"
                            onPressedChange={setOrange}
                            pressed={orange}
                            id="History_OrangeFilter"
                          >
                            <p className="m-2 group-aria-pressed/toggle:text-black">
                              Orange
                            </p>
                          </Toggle>
                          <Toggle
                            size="sm"
                            variant="outline"
                            className="aria-pressed:bg-red-500/50 aria-pressed:text-white border-gray-400"
                            onPressedChange={setRed}
                            pressed={red}
                            id="History_RedFilter"
                          >
                            Red
                          </Toggle>
                          <Toggle
                            size="sm"
                            variant="outline"
                            className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                            onPressedChange={setInactive}
                            pressed={inactive}
                            id="History_InactiveFilter"
                          >
                            <GlobeOff className="group-aria-pressed/toggle:stroke-white" />
                          </Toggle>
                        </div>

                        <div className="flex items-center gap-1">
                          <SelectDropdown
                            value={String(brgyFilter)}
                            onValueChange={(val) => setBrgyFilter(Number(val))}
                            placeholder="barangay"
                            id="History_BrgyFilter"
                            options={[
                              { label: "All", value: "0" },
                              ...(barangays?.map((barangays) => ({
                                label: barangays.name,
                                value: String(barangays.id),
                              })) ?? []),
                            ]}
                          />
                          {brgyFilter ? (
                            <button
                              onClick={() => setBrgyFilter(0)}
                              id="History_ClearBrgyFilter"
                            >
                              <X size={14} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              <div className="w-full flex justify-end items-center gap-2">
                <InputGroup className="w-2/3">
                  <InputGroupInput
                    className="text-sm h-8"
                    id="History_SearchField"
                  ></InputGroupInput>
                  <InputGroupAddon align="inline-end">
                    <Search />
                  </InputGroupAddon>
                </InputGroup>
                {role === "brgy_op" && (
                  <Filter size={18} id="History_FilterBtn" />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-screen">
              {isEvac
                ? activeEvac
                  ? evacPins.map((pins) => {
                      if (!pins.is_expired)
                        return (
                          <Row
                            postId={String(pins.id)}
                            title={pins.name}
                            address={pins.address}
                            datePosted={pins.posted_at}
                            link={`/EvacForm/${pins.id}`}
                            isExpired={pins.is_expired}
                            buttonId="History_ActiveEvacDetailsBtn"
                          />
                        );
                    })
                  : evacPins.map((pins) => {
                      if (pins.is_expired)
                        return (
                          <Row
                            postId={String(pins.id)}
                            title={pins.name}
                            address={pins.address}
                            datePosted={pins.posted_at}
                            link={`/EvacForm/${pins.id}`}
                            isExpired={pins.is_expired}
                            buttonId="History_ExpiredEvacDetailsBtn"
                          />
                        );
                    })
                : isSensors
                  ? sensors.map((pins) => {
                      return (
                        <Row
                          postId={String(pins.id)}
                          title={pins.name}
                          address={pins.address}
                          // datePosted={pins.posted_at}
                          link={`/SensorForm/${pins.id}`}
                          isExpired={pins.deactivatedAt}
                          buttonId="History_ExpiredEvacDetailsBtn"
                        />
                      );
                    })
                  : activeHaz
                    ? floodPaths.map((path) => {
                        if (!path.is_expired)
                          return (
                            <Row
                              postId={String(path.id)}
                              title="Flood"
                              address={path.description}
                              datePosted={path.last_confirmed}
                              link={`/HazardForm/${path.id}`}
                              isExpired={path.is_expired}
                              buttonId="History_ActiveHazardDetailsBtn"
                            />
                          );
                      })
                    : floodPaths.map((path) => {
                        if (path.is_expired)
                          return (
                            <Row
                              postId={String(path.id)}
                              title="Flood"
                              address={path.description}
                              datePosted={path.last_confirmed}
                              link="/HazardForm"
                              isExpired={path.is_expired}
                              buttonId="History_ExpHazardDetailsBtn"
                            />
                          );
                      })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;
