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
  Globe,
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
  level: string;
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

  const [isEvac, setIsEvac] = useState<boolean>();
  const [isSensors, setIsSensors] = useState<boolean>();
  const [sensors, setSensors] = useState<SensorsDetails[]>([]);
  const [activeEvacPins, setActiveEvacPins] = useState<myEvacPins[]>([]);
  const [inactiveEvacPins, setInactiveEvacPins] = useState<myEvacPins[]>([]);
  const [activeEvac, setActiveEvac] = useState<boolean>();
  const [activeHaz, setActiveHaz] = useState<boolean>();
  const [activeFloodPaths, setActiveFloodPaths] = useState<myFloodPaths[]>([]);
  const [inactiveFloodPaths, setInactiveFloodPaths] = useState<myFloodPaths[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"Inactive" | "Active" | null>();
  const [red, setRed] = useState(false);
  const [yellow, setYellow] = useState(false);
  const [orange, setOrange] = useState(false);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [levels, setLevels] = useState<FloodLevel[]>([]);
  const [levelFilter, setLevelFilter] = useState(0);
  const [searchFor, setSearchFor] = useState("");
  const [openCollapse, setOpenCollapse] = useState(false);

  let message: string;

  const colorHazard = {
    lightBlue: "#52B2DA",
    darkBlue: "#578EC2",
    red: "#B22B42",
    fallback: "#C7C7C7",
  };

  const getEvac = async (signal?: AbortSignal, search = searchFor) => {
    const params = new URLSearchParams();

    try {
      if (search) {
        if (isEvac) {
          params.set("search", search);
          message = "Search Results";
        } else {
          message = "";
        }
        if (!isEvac && !isSensors) {
          params.set("flood_level_id", String(levelFilter));
        }
      }

      const parameters = params.toString();

      const endpointEvac = `/evacpins/users?own_pins=true${parameters ? `&${parameters}` : ""}`;

      const response = await api.get(endpointEvac, { signal });

      const activeEvacs = await response.data.pins.filter(
        (pin: myEvacPins) => !pin.is_deactivated && !pin.is_expired,
      );

      const inactiveEvacs = await response.data.pins.filter(
        (pin: myEvacPins) => pin.is_expired,
      );

      setInactiveEvacPins(inactiveEvacs);
      setActiveEvacPins(activeEvacs);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getHazards = async (signal?: AbortSignal) => {
    const params = new URLSearchParams();

    try {
      if (levelFilter || levelFilter != 0) {
        params.set("flood_level_id", String(levelFilter));
        message = "Hazards filtered!";
      }

      const parameters = params.toString();

      const endpointHazard = `/flood-paths/my${parameters ? `?${parameters}` : ""}`;

      const response = await api.get(endpointHazard, { signal });

      const activeHazardPins = response.data.flood_paths.filter(
        (pin: myFloodPaths) => !pin.is_expired && !pin.is_deactivated,
      );

      const inactiveHazardPins = await response.data.flood_paths.filter(
        (pin: myFloodPaths) => pin.is_expired,
      );

      setActiveFloodPaths(activeHazardPins);
      setInactiveFloodPaths(inactiveHazardPins);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getBarangays = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/locations/barangays?city_id=2", {
        signal,
      });

      const barangays = response.data.Barangays;
      setBarangays(barangays);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getLevels = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/flood-levels", { signal });

      const levels = await response.data.flood_levels;
      setLevels(levels);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getSensors = async (signal?: AbortSignal, search = searchFor) => {
    const params = new URLSearchParams();

    try {
      if (status == "Inactive") {
        params.set("is_active", "0");
        message = "Inactive Sensors are shown";
      }

      if (status == "Active") {
        params.set("is_active", "1");
        message = "Active Sensors are shown";
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
        message = "Filtered to chosen barangay";
      }

      if (searchFor) {
        params.set("search", search);
        message = "Search results";
      }

      setLoading(true);
      const parameters = params.toString();
      const endpoint = `/sensors${parameters ? `?${parameters}` : ""}`;
      const sensorsResponse = await api.get(endpoint, { signal });

      if (!sensorsResponse) {
        console.log("Failed to retrieve data");
      }

      const mySensors = sensorsResponse.data.data;
      setSensors(mySensors);
      if (parameters) toast.success(message);
    } catch (err: string | any) {
      console.error(err.message || "An error occurred");
      toast.error(err?.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    const controller = new AbortController();

    try {
      if (isEvac && !isSensors) {
        setLoading(true);
        await getEvac(controller.signal);
      }

      if (!isEvac && !isSensors) {
        setLoading(true);
        await getHazards(controller.signal);
      }

      if (!isEvac && isSensors) {
        setLoading(true);
        await getSensors(controller.signal);
      }

      await getBarangays(controller.signal);
      await getLevels(controller.signal);

      return () => controller.abort();
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const getFiltered = async () => {
    const controller = new AbortController();

    try {
      if (isEvac && !isSensors) {
        setLoading(true);
        await getEvac(controller.signal);
      }

      if (!isEvac && !isSensors) {
        setLoading(true);
        await getHazards(controller.signal);
      }

      if (!isEvac && isSensors) {
        setLoading(true);
        await getSensors(controller.signal);
      }
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    getFiltered();
  }, [levelFilter, status, red, orange, yellow, brgyFilter, isSensors]);

  useEffect(() => {
    getData();
  }, [isEvac, isSensors]);

  useEffect(() => {
    setIsEvac(true);
    setActiveEvac(true);
    setActiveHaz(true);
  }, []);

  return (
    <div className="overflow-hidden h-screen flex justify-center pt-20 p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <p className="font-bold text-2xl" style={{ color: colors.heading }}>
          Pin History
        </p>
        {loading ? (
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
                    Evacuation
                  </TabsTrigger>
                  <TabsTrigger
                    value="Hazard"
                    onClick={() => {
                      setIsEvac(false);
                      setIsSensors(false);
                    }}
                    id="History_HazardTrigger"
                  >
                    Hazard
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
                    Evacuation
                  </TabsTrigger>
                  <TabsTrigger
                    value="Hazard"
                    onClick={() => {
                      setIsEvac(false);
                      setIsSensors(false);
                    }}
                    id="History_HazardTrigger"
                  >
                    Hazard
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
                {(isEvac || isSensors) && (
                  <div className="w-full flex justify-end items-center gap-2">
                    <InputGroup className="w-2/3">
                      <InputGroupInput
                        className="text-sm h-8"
                        id="History_SearchField"
                        onChange={(e) => setSearchFor(e.target.value)}
                        value={searchFor}
                      ></InputGroupInput>
                      <InputGroupAddon align="inline-end">
                        <Search
                          onClick={() => {
                            getFiltered();
                          }}
                        />
                      </InputGroupAddon>
                    </InputGroup>
                    {searchFor ? (
                      <button
                        onClick={() => {
                          setSearchFor("");
                          getFiltered();
                        }}
                        id="Hotline_SearchField"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              <>
                <Collapsible className="w-full flex flex-col justify-end rounded-md mt-2">
                  {!isEvac && (
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
                  )}
                  <CollapsibleContent
                    id="History_FiltersContent"
                    className="flex flex-col items-center  px-2.5 pt-0 text-sm"
                  >
                    {isSensors && (
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
                            onPressedChange={(pressed) =>
                              setStatus(pressed ? "Inactive" : null)
                            }
                            pressed={status == "Inactive"}
                            id="History_InactiveFilter"
                          >
                            <GlobeOff className="group-aria-pressed/toggle:stroke-white" />
                          </Toggle>
                          <Toggle
                            size="sm"
                            variant="outline"
                            className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                            onPressedChange={(pressed) =>
                              setStatus(pressed ? "Active" : null)
                            }
                            pressed={status == "Active"}
                            id="History_InactiveFilter"
                          >
                            <Globe className="group-aria-pressed/toggle:stroke-white" />
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
                    )}
                    {!isEvac && !isSensors && (
                      <div className="w-full gap-2 bg-gray-300/50 p-4 rounded-lg flex">
                        <SelectDropdown
                          value={String(levelFilter)}
                          onValueChange={(val) => setLevelFilter(Number(val))}
                          placeholder="Flood Level"
                          id="History_LevelFilter"
                          options={[
                            { label: "All", value: "0" },
                            ...(levels?.map((level) => ({
                              label: level.level_name,
                              value: String(level.id),
                            })) ?? []),
                          ]}
                        />
                        {levelFilter ? (
                          <button
                            onClick={() => setLevelFilter(0)}
                            id="History_ClearBrgyFilter"
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-screen">
              {isEvac ? (
                activeEvac ? (
                  activeEvacPins.length > 0 ? (
                    activeEvacPins.map((pins) => {
                      return (
                        <Row
                          title={pins.name}
                          address={pins.address}
                          datePosted={pins.posted_at}
                          link={`/EvacForm/${pins.id}`}
                          isExpired={pins.is_expired}
                          buttonId="History_ActiveEvacDetailsBtn"
                          showBtn
                        ></Row>
                      );
                    })
                  ) : (
                    <p className="text-center">
                      You don't have active evacuation pins. Mark one on the
                      map!
                    </p>
                  )
                ) : inactiveEvacPins.length > 0 ? (
                  inactiveEvacPins.map((pins) => {
                    return (
                      <Row
                        title={pins.name}
                        address={pins.address}
                        datePosted={pins.posted_at}
                        link={`/EvacForm/${pins.id}`}
                        isExpired={pins.is_expired}
                        buttonId="History_ExpiredEvacDetailsBtn"
                        showBtn
                      />
                    );
                  })
                ) : (
                  <p className="text-center">No expired evacuation pins yet!</p>
                )
              ) : isSensors ? (
                sensors.length > 0 ? (
                  sensors.map((pins) => {
                    return (
                      <Row
                        postId={String(pins.sensorCode)}
                        title={pins.name}
                        desc={`Status: ${pins.currentStatus}`}
                        address={`${pins.address}`}
                        datePosted={pins.lastOnline}
                        link={`/SensorForm/${pins.id}`}
                        buttonId="History_ExpiredEvacDetailsBtn"
                        showBtn
                      >
                        <div className="flex flex-row gap-2">
                          <div
                            className={`mt-2 px-2 py-1 rounded-3xl ${pins.deactivatedAt ? "bg-gray-500/30" : "bg-green-700/60"} w-fit text-sm`}
                          >
                            {pins.deactivatedAt ? "Inactive" : "Active"}
                          </div>
                          {!pins.deactivatedAt && (
                            <div
                              className={`mt-2 px-2 py-1 rounded-3xl ${pins.currentStatus == "normal" ? "bg-green-700/60" : pins.currentStatus == "yellow" ? "bg-yellow-700/60" : pins.currentStatus == "orange" ? "bg-amber-700/60" : pins.currentStatus == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
                            >
                              {pins.currentStatus
                                ? pins.currentStatus
                                : "No Level Detected"}
                            </div>
                          )}
                        </div>
                      </Row>
                    );
                  })
                ) : (
                  <p className="text-center">No registered sensors.</p>
                )
              ) : activeHaz ? (
                activeFloodPaths.length > 0 ? (
                  activeFloodPaths.map((path) => {
                    if (!path.is_expired)
                      return (
                        <Row
                          title="Flood"
                          address={path.description}
                          datePosted={path.last_confirmed}
                          link={`/HazardForm/${path.id}`}
                          isExpired={path.is_expired}
                          buttonId="History_ActiveHazardDetailsBtn"
                          showBtn
                        >
                          <div
                            className={`mt-2 px-2 py-1 rounded-3xl w-fit text-sm`}
                            style={{
                              backgroundColor:
                                path.level === "Gutter-Deep" ||
                                path.level === "Half Knee-Deep"
                                  ? colorHazard.lightBlue
                                  : path.level === "Half Tire-Deep" ||
                                      path.level === "Knee-Deep"
                                    ? colorHazard.darkBlue
                                    : path.level === "Tire-Deep" ||
                                        path.level === "Waist-Deep" ||
                                        path.level === "Chest-Deep"
                                      ? colorHazard.red
                                      : colorHazard.fallback,
                              color:
                                path.level === "Gutter-Deep" ||
                                path.level === "Half Knee-Deep"
                                  ? "Black"
                                  : path.level === "Half Tire-Deep" ||
                                      path.level === "Knee-Deep"
                                    ? "White"
                                    : path.level === "Tire-Deep" ||
                                        path.level === "Waist-Deep" ||
                                        path.level === "Chest-Deep"
                                      ? "White"
                                      : colorHazard.fallback,
                            }}
                          >
                            {path.level}
                          </div>
                        </Row>
                      );
                  })
                ) : (
                  <p className="text-center">
                    You don't have active hazard pins. Mark one on the map!
                  </p>
                )
              ) : inactiveFloodPaths.length > 0 ? (
                inactiveFloodPaths.map((path) => {
                  if (path.is_expired)
                    return (
                      <Row
                        title="Flood"
                        desc={path.level}
                        address={path.description}
                        datePosted={path.last_confirmed}
                        link="/HazardForm"
                        isExpired={path.is_expired}
                        buttonId="History_ExpHazardDetailsBtn"
                      />
                    );
                })
              ) : (
                <p className="text-center">
                  You don't have expired hazard pins yet!
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;
