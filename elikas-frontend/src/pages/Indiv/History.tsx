import colors from "@/constants/colors";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import Row from "@/components/Row";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Search,
  X,
  GlobeOff,
} from "lucide-react";
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
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";
import SelectDropdown from "@/components/SelectDropdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
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
  const [initialLoad, setInitialLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inactive, setInactive] = useState(false);
  const [red, setRed] = useState(false);
  const [yellow, setYellow] = useState(false);
  const [orange, setOrange] = useState(false);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [openCollapse, setOpenCollapse] = useState(false);

  useEffect(() => {
    let message: string;
    const params = new URLSearchParams();

    if (inactive) {
      params.set("is_active", "0");
      message = "Inactive Sensors are shown";
    } else {
      message = "";
    }

    if (yellow) {
      params.append("current_status[]", "yellow");
      message = "Sensors filtered to yellow alerts";
    } else {
      message = "";
    }

    if (orange) {
      params.append("current_status[]", "orange");
      message = "Sensors filtered to orange alerts";
    } else {
      message = "";
    }

    if (red) {
      params.append("current_status[]", "red");
      message = "Sensors filtered to red alerts";
    } else {
      message = "";
    }

    if (brgyFilter || brgyFilter != 0) {
      params.set("location_id", String(brgyFilter));
      message = "Sensors filtered to chosen barangay";
    } else {
      message = "";
    }

    if (!isSensors) return;

    if (isSensors) {
      const getSensors = async () => {
        try {
          setLoading(true);
          const parameters = params.toString();
          const endpoint = `/sensors${parameters ? `?${parameters}` : ""}`;
          console.log(endpoint);
          const sensorsResponse = await api.get(
            `/sensors?${parameters ? `?${parameters}` : ""}`,
          );

          if (!sensorsResponse) {
            console.log("Failed to retrieve data");
          }

          const mySensors = sensorsResponse.data.data;
          setSensors(mySensors);
          toast.success(message);
        } catch (err: string | any) {
          console.error(err.message || "An error occurred");
          toast.error(err?.response?.data?.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };

      getSensors();
    }
  }, [inactive, red, orange, yellow, brgyFilter]);

  useEffect(() => {
    const getMyPins = async () => {
      try {
        setInitialLoad(true);
        const [floodResponse, evacResponse, sensorResponse, brgyResponse] =
          await Promise.all([
            api.get("/flood-paths/my"),
            api.get("/evacpins/users?own_pins=true"),
            api.get("/sensors?sort_by=last_online_null&sort_order=asc"),
            api.get("/locations/barangays?city_id=10"),
          ]);

        console.log(floodResponse);

        if (
          !floodResponse ||
          !evacResponse ||
          !sensorResponse ||
          brgyResponse
        ) {
          console.log("Failed to retrieve data");
        }
        const myHazards = await floodResponse.data.flood_paths;
        const myEvacs = await evacResponse.data.pins;
        const mySensors = await sensorResponse.data.data;
        const barangays = await brgyResponse.data.Barangays;

        setFloodPaths(myHazards);
        setEvacPins(myEvacs);
        setSensors(mySensors);
        setBarangays(barangays);
      } catch (err: string | any) {
        Error(err.message || "An error occurred");
      } finally {
        setInitialLoad(false);
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
        {initialLoad ? (
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
        ) : loading ? (
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
            <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
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
            <div className="flex flex-col justify-between items-center">
              <div className="w-full flex items-center">
                {isSensors && (
                  <div>
                    <Link to="/SensorForm">
                      <ButtonComp
                        text="Add Sensor"
                        variant="primary"
                        id="History_AddSensorBtn"
                        type="button"
                      />
                    </Link>
                  </div>
                )}
                <div className="w-full flex flex-col justify-end items-end gap-2">
                  <InputGroup className="w-2/3">
                    <InputGroupInput
                      className="text-sm h-8"
                      id="History_SearchField"
                    ></InputGroupInput>
                    <InputGroupAddon align="inline-end">
                      <Search />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>
              {isSensors && (
                <>
                  <Collapsible className="w-full flex flex-col justify-end rounded-md mt-2">
                    <CollapsibleTrigger
                      onClick={() => setOpenCollapse(!openCollapse)}
                    >
                      <div className="w-full flex flex-row justify-end mb-2">
                        Filters
                        {openCollapse ? (
                          <ChevronUpIcon className="ml-2 group-data-[state=open]:rotate-180" />
                        ) : (
                          <ChevronDownIcon className="ml-2 group-data-[state=open]:rotate-180" />
                        )}
                      </div>{" "}
                    </CollapsibleTrigger>
                    <CollapsibleContent
                      id="Drawer_FacilitiesContent"
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
                            id="History_YellowField"
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
                            id="History_OrangeField"
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
                            id="History_RedField"
                          >
                            Red
                          </Toggle>
                          <Toggle
                            size="sm"
                            variant="outline"
                            className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                            onPressedChange={setInactive}
                            pressed={inactive}
                            id="History_InactiveField"
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
                            <button onClick={() => setBrgyFilter(0)}>
                              <X size={14} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
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
                          postId={String(pins.sensorCode)}
                          title={pins.name}
                          desc={`Status: ${pins.currentStatus}`}
                          address={`${pins.address}`}
                          datePosted={pins.lastOnline}
                          link={`/SensorForm/${pins.id}`}
                          // isExpired={pins.deactivatedAt}
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
