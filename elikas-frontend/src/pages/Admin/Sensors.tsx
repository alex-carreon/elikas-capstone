import DashboardHeader from "@/components/Admin/DashboardHeader";
import CountRow from "@/components/Admin/CountRow";
import api from "@/api";
import { useState, useEffect, Fragment } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { ChevronDownIcon, ChevronUpIcon, Search, X } from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import SelectDropdown from "@/components/SelectDropdown";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { toast } from "sonner";
import { Toggle } from "@/components/ui/toggle";

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
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

function Sensors() {
  const [isSensors, setIsSensors] = useState(true);
  const [isSensorLogs, setIsSensorLogs] = useState(false);
  const [isActiveSensor, setIsActiveSensor] = useState(true);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [activeBrgyFilter, setActiveBrgyFilter] = useState(0);
  const [inactiveBrgyFilter, setInactiveBrgyFilter] = useState(0);
  const [activeSensors, setActiveSensors] = useState<SensorsDetails[]>([]);
  const [activeSensorsCount, setActiveSensorsCount] = useState(0);
  const [inactiveSensorsCount, setInactiveSensorsCount] = useState(0);
  const [searchFor, setSearchFor] = useState("");
  const [red, setRed] = useState(false);
  const [yellow, setYellow] = useState(false);
  const [orange, setOrange] = useState(false);

  const [inactiveSensors, setInactiveSensors] = useState<SensorsDetails[]>([]);

  const params = new URLSearchParams();

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const getBarangays = async (signal?: AbortSignal) => {
    try {
      const brgyRes = await api.get(`/locations/barangays?city_id=2`, {
        signal,
      });
      const barangays = brgyRes.data.Barangays;
      setBarangays(barangays);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getSensors = async (signal?: AbortSignal) => {
    try {
      const [activeSensorsRes, inactiveSensorsRes] = await Promise.all([
        api.get(`/sensors?is_active=1`, { signal }),
        api.get(`/sensors?is_active=0`, { signal }),
      ]);

      const activeSensors = activeSensorsRes.data.data;
      const inactiveSensors = inactiveSensorsRes.data.data;
      const activeCount = activeSensors.length;
      const inactiveCount = inactiveSensors.length;

      setActiveSensors(activeSensors);
      setInactiveSensors(inactiveSensors);
      setActiveSensorsCount(activeCount);
      setInactiveSensorsCount(inactiveCount);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getFilteredActive = async (
    signal?: AbortSignal,
    search = searchFor,
  ) => {
    try {
      if (activeBrgyFilter || activeBrgyFilter != 0) {
        params.set("location_id", String(activeBrgyFilter));
      }

      if (searchFor) {
        params.set("search", search);
      }

      if (yellow) {
        params.append("current_status[]", "yellow");
      }

      if (orange) {
        params.append("current_status[]", "orange");
      }

      if (red) {
        params.append("current_status[]", "red");
      }

      const parameters = params.toString();

      const activeSensorsRes = await api.get(
        `/sensors?is_active=1${parameters ? `&${parameters}` : ""}`,
        { signal },
      );

      const endpoint = `/sensors?is_active=1${parameters ? `&${parameters}` : ""}`;
      console.log(endpoint);
      const activeSensors = activeSensorsRes.data.data;

      console.log(activeSensors);

      setActiveSensors(activeSensors);
      toast.success("Sensors filtered!");
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getFilteredInactive = async (
    signal?: AbortSignal,
    search = searchFor,
  ) => {
    try {
      if (yellow) {
        params.append("current_status[]", "yellow");
      }

      if (orange) {
        params.append("current_status[]", "orange");
      }

      if (red) {
        params.append("current_status[]", "red");
      }

      if (inactiveBrgyFilter || inactiveBrgyFilter != 0) {
        params.set("location_id", String(inactiveBrgyFilter));
      }

      if (searchFor) {
        params.set("search", search);
      }

      const parameters = params;

      const inactiveSensorsRes = await api.get(
        `/sensors?is_active=0${parameters ? `&${parameters}` : ""}`,
        { signal },
      );

      const inactiveSensors = inactiveSensorsRes.data.data;

      setInactiveSensors(inactiveSensors);

      toast.success("Sensors filtered!");
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await Promise.all([
        getSensors(controller.signal),
        getBarangays(controller.signal),
      ]);

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

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (activeBrgyFilter || yellow || red || orange) {
      getFilteredActive(controller.signal);
    }

    return () => controller.abort();
  }, [activeBrgyFilter, yellow, red, orange]);

  useEffect(() => {
    const controller = new AbortController();
    getFilteredInactive(controller.signal);
    toast.success("Sensors filtered!");
    return () => controller.abort();
  }, [inactiveBrgyFilter, yellow, red, orange]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md">
        <DashboardHeader title="Sensors">
          <CountRow
            title="Active Sensors"
            lastUpdated="Not Deactivated or Expired"
            count={activeSensorsCount}
            loading={loading}
          />
          <CountRow
            title="Inactive Sensors"
            lastUpdated="Both Deactivated or Expired"
            count={inactiveSensorsCount}
            loading={loading}
          />
        </DashboardHeader>
        <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            <TabsList className="w-full flex justify-between">
              <TabsTrigger
                value="Sensors"
                onClick={() => {
                  setIsSensors(true);
                  setIsSensorLogs(false);
                }}
                id="Admin_SensorsTrigger"
              >
                All Sensors
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            {isSensors && !isSensorLogs && (
              <TabsList
                variant="line"
                className="w-full flex justify-between"
                id="Admin_SensorTabs"
              >
                <TabsTrigger
                  value="ActiveSensors"
                  id="Admin_ActiveSensorTrigger"
                  onClick={() => setIsActiveSensor(true)}
                >
                  Active Sensors
                </TabsTrigger>
                <TabsTrigger
                  value="ExpiredEvac"
                  id="Admin_InactiveSensorTrigger"
                  onClick={() => setIsActiveSensor(false)}
                >
                  Inactive Sensors
                </TabsTrigger>
              </TabsList>
            )}
          </Tabs>
          <Collapsible className="w-full flex-col items-center gap-2">
            <div className="w-full flex justify-between">
              <InputGroup className="w-2/3">
                <InputGroupInput
                  className="text-sm h-8"
                  id="Admin_SensorSearchField"
                  onChange={(e) => setSearchFor(e.target.value)}
                  value={searchFor}
                ></InputGroupInput>
                <InputGroupAddon align="inline-end">
                  <Search
                    onClick={() => {
                      isActiveSensor
                        ? getFilteredActive()
                        : getFilteredInactive();
                    }}
                  />
                </InputGroupAddon>
              </InputGroup>
              <CollapsibleTrigger
                onClick={() => setOpenCollapse(!openCollapse)}
                id="Admin_SensorFilterTrigger"
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
            </div>
            <CollapsibleContent
              id="Admin_SensorFilterContent"
              className="bg-gray-300/50 p-2 rounded-lg flex flex-row items-center justify-end gap-2 px-2.5 mt-2 text-sm"
            >
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
              <SelectDropdown
                value={
                  isActiveSensor
                    ? String(activeBrgyFilter)
                    : String(inactiveBrgyFilter)
                }
                onValueChange={(val) => {
                  isActiveSensor
                    ? setActiveBrgyFilter(Number(val))
                    : setInactiveBrgyFilter(Number(val));
                }}
                placeholder="Barangay"
                id="Admin_SensorsBrgyFilter"
                options={[
                  { label: "All", value: "0" },
                  ...barangays?.map((barangay) => ({
                    label: barangay.name,
                    value: String(barangay.id),
                  })),
                ]}
              />
              {activeBrgyFilter || inactiveBrgyFilter ? (
                <button
                  onClick={() =>
                    activeSensors
                      ? setActiveBrgyFilter(0)
                      : setInactiveBrgyFilter(0)
                  }
                  id="Admin_ClearSensorsBrgyFilter"
                >
                  <X size={14} />
                </button>
              ) : null}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-col gap-2">
            {loading ? (
              <>
                <div className="w-full flex flex-col items-center">
                  <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
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
                </div>
              </>
            ) : isSensors ? (
              isActiveSensor ? (
                activeSensors.map((sensors) => (
                  <Fragment key={sensors.id}>
                    <Row
                      postId={String(sensors.sensorCode)}
                      title={sensors.name}
                      desc={`Status: ${sensors.currentStatus}`}
                      address={`${sensors.address}`}
                      datePosted={
                        sensors.lastOnline
                          ? `Last Online: ${convertDateTime(sensors.lastOnline)}`
                          : "Not yet installed"
                      }
                      link={`/admin-sensorDetails/${sensors.id}`}
                      buttonId="Admin_SensorDetailsBtn"
                      showBtn
                    >
                      <div className="flex flex-row gap-2">
                        {!sensors.deactivatedAt && (
                          <div
                            className={`mt-2 px-2 py-1 rounded-3xl ${sensors.currentStatus == "normal" ? "bg-green-700/60" : sensors.currentStatus == "yellow" ? "bg-yellow-700/60" : sensors.currentStatus == "orange" ? "bg-amber-700/60" : sensors.currentStatus == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
                          >
                            {sensors.currentStatus
                              ? sensors.currentStatus
                              : "No Level Detected"}
                          </div>
                        )}
                      </div>
                    </Row>
                  </Fragment>
                ))
              ) : (
                inactiveSensors.map((sensors) => (
                  <Fragment key={sensors.id}>
                    <Row
                      postId={String(sensors.sensorCode)}
                      title={sensors.name}
                      desc={`Status: ${sensors.currentStatus}`}
                      address={`${sensors.address}`}
                      datePosted={`Deactivated at: ${convertDateTime(sensors.deactivatedAt)}`}
                      link={`/admin-sensorDetails/${sensors.id}`}
                      buttonId="Admin_SensorDetailsBtn"
                      showBtn
                    ></Row>
                  </Fragment>
                ))
              )
            ) : (
              // sensors.map((pins) => {
              //   return (
              //     <Row
              //       postId={String(pins.sensorCode)}
              //       title={pins.name}
              //       desc={`Status: ${pins.currentStatus}`}
              //       address={`${pins.address}`}
              //       datePosted={pins.lastOnline}
              //       link={`/SensorForm/${pins.id}`}
              //       // isExpired={pins.deactivatedAt}
              //       buttonId="History_ExpiredEvacDetailsBtn"
              //       showBtn
              //     >
              //       <div className="flex flex-row gap-2">
              //         <div
              //           className={`mt-2 px-2 py-1 rounded-3xl ${pins.deactivatedAt ? "bg-gray-500/30" : "bg-green-700/60"} w-fit text-sm`}
              //         >
              //           {pins.deactivatedAt ? "Inactive" : "Active"}
              //         </div>
              //         {!pins.deactivatedAt && (
              //           <div
              //             className={`mt-2 px-2 py-1 rounded-3xl ${pins.currentStatus == "normal" ? "bg-green-700/60" : pins.currentStatus == "yellow" ? "bg-yellow-700/60" : pins.currentStatus == "orange" ? "bg-amber-700/60" : pins.currentStatus == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
              //           >
              //             {pins.currentStatus
              //               ? pins.currentStatus
              //               : "No Level Detected"}
              //           </div>
              //         )}
              //       </div>
              //     </Row>
              //   );
              // })
              <Row
                postId="Placeholder"
                title="Placeholder"
                desc="Placeholder"
                address="Placeholder"
                datePosted="Placeholder"
                link="Placeholder"
                // isExpired={pins.deactivatedAt}
                buttonId="Placeholder"
                showBtn
              >
                {/* <div className="flex flex-row gap-2">
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
                  </div> */}
              </Row>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sensors;
